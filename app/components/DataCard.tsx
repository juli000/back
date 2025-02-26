import React from "react";

interface DataCardProps {
  instrument: any;
}

const DataCard: React.FC<DataCardProps> = ({ instrument }) => {
  return (
    <div className="bg-gray-900 shadow-xl rounded-lg p-6 mb-4 text-white">
      <div className="flex justify-between items-center">
        <div className="flex gap-8">
          <div>
            <p className="text-gray-400">Bet</p>
            <p className="font-semibold">{instrument.bet}</p>
          </div>
          <div>
            <p className="text-gray-400">Key Type</p>
            <p className="font-semibold">{instrument.key_type}</p>
          </div>
          <div>
            <p className="text-gray-400">Users</p>
            <p className="font-semibold">{instrument.users_paid}</p>
          </div>
          <div>
            <p className="text-gray-400">Player 1</p>
            <p className="font-semibold">{instrument.user1}</p>
          </div>
        </div>
        <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded">
          Join Game
        </button>
      </div>
    </div>
  );
};

export default DataCard; 