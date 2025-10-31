import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface TableData {
  table: number;
  occupied: boolean;
  guests: number;
  duration: number;
  intensity: number;
}

const TableOccupancyHeatmap: React.FC = () => {
  const { token } = useAuth();
  const [heatmapData, setHeatmapData] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchHeatmapData();
      const interval = setInterval(fetchHeatmapData, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [token]);

  const fetchHeatmapData = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/owner/tables/heatmap`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setHeatmapData(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching heatmap data:', error);
      setLoading(false);
    }
  };

  const getIntensityColor = (intensity: number) => {
    if (intensity === 0) return 'bg-gray-100 hover:bg-gray-200';
    if (intensity < 0.3) return 'bg-blue-100 hover:bg-blue-200';
    if (intensity < 0.6) return 'bg-yellow-100 hover:bg-yellow-200';
    if (intensity < 0.8) return 'bg-orange-100 hover:bg-orange-200';
    return 'bg-red-100 hover:bg-red-200';
  };

  const getIntensityBorder = (intensity: number) => {
    if (intensity === 0) return 'border-gray-300';
    if (intensity < 0.3) return 'border-blue-400';
    if (intensity < 0.6) return 'border-yellow-400';
    if (intensity < 0.8) return 'border-orange-400';
    return 'border-red-500';
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading heatmap...</div>;
  }

  // Organize tables in a 5-column grid (typical bar layout)
  const tableColumns = 5;
  const totalTables = Math.max(...heatmapData.map((t) => t.table), 20);
  const rows = Math.ceil(totalTables / tableColumns);

  const tableGrid: (TableData | null)[][] = [];
  for (let i = 0; i < rows; i++) {
    tableGrid[i] = [];
    for (let j = 0; j < tableColumns; j++) {
      const tableNum = i * tableColumns + j + 1;
      const tableData = heatmapData.find((t) => t.table === tableNum);
      tableGrid[i][j] = tableData || null;
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Table Occupancy Heatmap</h2>

      {/* Legend */}
      <div className="mb-6 flex gap-4 flex-wrap text-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-100 border border-gray-300 rounded"></div>
          <span className="text-gray-600">Empty</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-100 border border-blue-400 rounded"></div>
          <span className="text-gray-600">Light</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-yellow-100 border border-yellow-400 rounded"></div>
          <span className="text-gray-600">Medium</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-orange-100 border border-orange-400 rounded"></div>
          <span className="text-gray-600">High</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-red-100 border border-red-500 rounded"></div>
          <span className="text-gray-600">Full</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <div className="space-y-3 inline-block">
          {tableGrid.map((row, rowIdx) => (
            <div key={rowIdx} className="flex gap-3">
              {row.map((tableData, colIdx) => {
                const tableNum = rowIdx * tableColumns + colIdx + 1;
                return (
                  <div
                    key={`table-${tableNum}`}
                    className={`
                      w-20 h-20 rounded-lg border-2 flex flex-col items-center justify-center cursor-pointer
                      transition-all duration-200 transform hover:scale-105
                      ${tableData ? getIntensityColor(tableData.intensity) : 'bg-gray-50 border-gray-200'}
                      ${tableData ? getIntensityBorder(tableData.intensity) : 'border-gray-200'}
                    `}
                  >
                    <div className="text-xs font-semibold text-gray-700">Table {tableNum}</div>
                    {tableData && tableData.occupied ? (
                      <>
                        <div className="text-lg font-bold text-gray-900 mt-1">{tableData.guests}</div>
                        <div className="text-xs text-gray-600">
                          {Math.round(tableData.duration)}m
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-gray-500 mt-1">Empty</div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      {heatmapData.length > 0 && (
        <div className="mt-6 grid grid-cols-3 gap-4 pt-6 border-t">
          <div>
            <p className="text-sm text-gray-600">Occupied Tables</p>
            <p className="text-2xl font-bold text-gray-900">
              {heatmapData.filter((t) => t.occupied).length}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Guests</p>
            <p className="text-2xl font-bold text-gray-900">
              {heatmapData.reduce((sum, t) => sum + (t.occupied ? t.guests : 0), 0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Occupancy Rate</p>
            <p className="text-2xl font-bold text-gray-900">
              {heatmapData.length > 0
                ? Math.round((heatmapData.filter((t) => t.occupied).length / heatmapData.length) * 100)
                : 0}
              %
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableOccupancyHeatmap;
