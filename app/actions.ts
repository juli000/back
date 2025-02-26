"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  if (!email || !password) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Email and password are required",
    );
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error(error.code + " " + error.message);
    return encodedRedirect("error", "/sign-up", error.message);
  } else {
    return encodedRedirect(
      "success",
      "/sign-up",
      "Thanks for signing up! Please check your email for a verification link.",
    );
  }
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  return redirect("/protected");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
  });

  if (error) {
    console.error(error.message);
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password",
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password.",
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Passwords do not match",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password update failed",
    );
  }

  encodedRedirect("success", "/protected/reset-password", "Password updated");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};

export async function createPendingGame(data: {
  name: string;
  call: string;
  numKeys: number;
  keyType: string;
}) {
  const supabase = await createClient();
  
  try {
    const { data: pendingGame, error } = await supabase
      .from('pending_games')  // Create this table for pending games
      .insert([
        {
          bet: data.numKeys,
          key_type: data.keyType,
          date_created: new Date().toISOString(),
          user1: data.name,
          user1_call: data.call,
          payment_code: `PAY-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Failed to create pending game: ${error.message}`);
    }

    return pendingGame;
  } catch (error) {
    console.error('Create pending game error:', error);
    throw error;
  }
}

export const confirmPayment = async (gameId: number) => {
  const supabase = await createClient();
  
  try {
    // Update the game status
    const { error: updateError } = await supabase
      .from('pending_games')
      .update({ status: 'payment_confirmed' })
      .eq('id', gameId);

    if (updateError) throw updateError;

    // Redirect to waiting room
    return `/waiting-room?gameId=${gameId}`;
  } catch (error) {
    console.error('Error confirming payment:', error);
    throw error;
  }
};

export async function verifyPayment(gameId: number) {
  'use server';
  
  const supabase = createClient();
  
  try {
    // Get the pending game data
    const { data: pendingGame, error: fetchError } = await supabase
      .from('pending_games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (fetchError || !pendingGame) {
      console.error('Fetch error:', fetchError);
      throw new Error('Game not found');
    }

    // Insert into instruments table
    const { data: newGame, error: insertError } = await supabase
      .from('instruments')
      .insert({
        bet: pendingGame.bet,
        key_type: pendingGame.key_type,
        date_created: pendingGame.date_created,
        users_paid: 1,
        user1: pendingGame.user1,
        user1_call: pendingGame.user1_call,
        user1_payment: true
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    return { success: true, gameId: newGame.id };
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw error;
  }
}

export async function verifyPlayer2Payment(gameId: number) {
  'use server';
  
  const supabase = createClient();
  
  try {
    // Update the game in instruments directly
    const { error: updateError } = await supabase
      .from('instruments')
      .update({
        user2_payment: true,
        users_paid: 2
      })
      .eq('id', gameId);

    if (updateError) {
      console.error('Update error:', updateError);
      throw updateError;
    }

    // Get the updated game to check payments
    const { data: updatedGame } = await supabase
      .from('instruments')
      .select('*')
      .eq('id', gameId)
      .single();

    if (!updatedGame) {
      throw new Error('Game not found in instruments table');
    }

    // Find and delete the corresponding pending game if both payments are verified
    if (updatedGame.user1_payment && updatedGame.user2_payment) {
      const { error: deleteError } = await supabase
        .from('pending_games')
        .delete()
        .eq('bet', updatedGame.bet)
        .eq('key_type', updatedGame.key_type)
        .eq('user1', updatedGame.user1);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        throw deleteError;
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error verifying player 2 payment:', error);
    throw error;
  }
}

export async function joinGame(data: {
  gameId: number;
  name: string;
  call: string;
}) {
  'use server';
  
  const supabase = createClient();
  
  try {
    // Generate a unique payment code for player 2
    const payment_code = `PAY2-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Get the game from instruments
    const { data: game, error: fetchError } = await supabase
      .from('instruments')
      .select()
      .eq('id', data.gameId)
      .single();

    if (fetchError || !game) {
      console.error('Fetch error:', fetchError);
      throw new Error('Game not found');
    }

    // Update the game with player 2's info
    const { error: updateError } = await supabase
      .from('instruments')
      .update({
        user2: data.name,
        user2_call: data.call,
        user2_payment_code: payment_code,
        user2_payment: false
      })
      .eq('id', data.gameId);

    if (updateError) {
      console.error('Update error:', updateError);
      throw new Error(`Failed to join game: ${updateError.message}`);
    }

    return { success: true, payment_code };
  } catch (error) {
    console.error('Join game error:', error);
    throw error;
  }
}

export async function storeCompletedGame(data: {
  gameId: number;
  bet: number;
  keyType: string;
  player1: string;
  player2: string;
  winner: string;
  coinResult: 'Heads' | 'Tails';
}) {
  'use server';
  
  const supabase = createClient();
  const maxRetries = 3;
  let currentTry = 0;
  
  while (currentTry < maxRetries) {
    try {
      const payout = data.bet * 2;
      
      // First, check if a completed game already exists for this game ID
      const { data: existingGame } = await supabase
        .from('completed_games')
        .select('id')
        .eq('original_game_id', data.gameId)
        .single();

      if (existingGame) {
        console.log('Game already completed:', data.gameId);
        return { success: true };
      }

      // If no existing completed game, insert new one
      const { error: insertError } = await supabase
        .from('completed_games')
        .insert({
          bet_amount: data.bet,
          key_type: data.keyType,
          player1_name: data.player1,
          player2_name: data.player2,
          winner_name: data.winner,
          payout: payout,
          original_game_id: data.gameId,
          coin_result: data.coinResult
        });

      if (insertError) {
        if (insertError.code === 'PGRST116' || insertError.message.includes('timeout')) {
          // If it's a timeout error, retry
          currentTry++;
          if (currentTry < maxRetries) {
            console.log(`Retrying store completed game... Attempt ${currentTry + 1}`);
            await new Promise(resolve => setTimeout(resolve, 1000 * currentTry)); // Exponential backoff
            continue;
          }
        }
        throw insertError;
      }

      return { success: true };
    } catch (error) {
      console.error(`Error in storeCompletedGame (attempt ${currentTry + 1}):`, error);
      currentTry++;
      
      if (currentTry >= maxRetries) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        throw new Error(`Failed to store completed game after ${maxRetries} attempts: ${errorMessage}`);
      }
      
      // Wait before retrying with exponential backoff
      await new Promise(resolve => setTimeout(resolve, 1000 * currentTry));
    }
  }
  
  throw new Error(`Failed to store completed game after ${maxRetries} attempts`);
}

export async function deleteGame(gameId: number, isPending: boolean = false) {
  'use server';
  
  const supabase = createClient();
  
  try {
    if (isPending) {
      // Delete from pending_games table
      const { error: deletePendingError } = await supabase
        .from('pending_games')
        .delete()
        .eq('id', gameId);

      if (deletePendingError) {
        throw deletePendingError;
      }
    } else {
      // Delete from instruments table (completed_games will be handled by CASCADE)
      const { error: deleteGameError } = await supabase
        .from('instruments')
        .delete()
        .eq('id', gameId);

      if (deleteGameError) {
        throw deleteGameError;
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting game:', error);
    throw new Error('Failed to delete game');
  }
}

export async function setCoinResult(gameId: number, result: 'Heads' | 'Tails') {
  'use server';
  
  try {
    const supabase = await createClient();
    
    // First verify the game exists
    const { data: game, error: fetchError } = await supabase
      .from('instruments')
      .select('*')
      .eq('id', gameId)
      .single();

    if (fetchError) {
      console.error('Error fetching game:', fetchError);
      throw new Error(fetchError.message);
    }

    if (!game) {
      throw new Error('Game not found');
    }

    // Then update the predetermined result
    const { error: updateError } = await supabase
      .from('instruments')
      .update({ predetermined_result: result })
      .eq('id', gameId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating game:', updateError);
      throw new Error(updateError.message);
    }

    return { success: true };
  } catch (error) {
    console.error('Error setting coin result:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to set coin result');
  }
}
