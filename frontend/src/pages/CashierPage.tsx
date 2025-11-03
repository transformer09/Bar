import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

interface Payment {
  id: string;
  amount: number;
  order_id: string;
  payment_status: string;
  orders: {
    order_number: string;
    total_amount: number;
    users: { first_name: string; last_name: string };
  };
  payment_methods: { name: string };
}

const CashierPage: React.FC = () => {
  const { token } = useAuth();
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [transactionRef, setTransactionRef] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    fetchPendingPayments();
    fetchPaymentMethods();
  }, [token]);

  const fetchPendingPayments = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/cashier/payments/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setPendingPayments(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching payments:', error);
      setLoading(false);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/cashier/payment-methods`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setPaymentMethods(data);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  };

  const handleConfirmPayment = async (payment: Payment) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/cashier/payments/${payment.id}/confirm`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transaction_reference: transactionRef || undefined,
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to confirm payment');

      // Generate final receipt
      await fetch(`${import.meta.env.VITE_API_URL}/receipts/generate/final`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ order_id: payment.order_id }),
      });

      setShowConfirmModal(false);
      setTransactionRef('');
      setSelectedPayment(null);
      fetchPendingPayments();
    } catch (error) {
      console.error('Error confirming payment:', error);
      alert('Failed to confirm payment');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Cashier Dashboard</h1>
        <p className="text-gray-600">Confirm and process pending payments</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-600 text-sm font-semibold mb-2">Pending Payments</h3>
          <p className="text-3xl font-bold text-primary">{pendingPayments.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-600 text-sm font-semibold mb-2">Total Pending</h3>
          <p className="text-3xl font-bold text-secondary">
            ${pendingPayments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-600 text-sm font-semibold mb-2">Today's Orders</h3>
          <p className="text-3xl font-bold text-accent">{pendingPayments.length}</p>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Order #
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Waiter
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Status
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {pendingPayments.map((payment) => (
              <tr key={payment.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-semibold text-gray-900">
                  {payment.orders.order_number}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {payment.orders.users.first_name} {payment.orders.users.last_name}
                </td>
                <td className="px-6 py-4">
                  <span className="font-bold text-lg text-primary">
                    ${payment.amount.toFixed(2)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      payment.payment_status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {payment.payment_status === 'pending' ? 'Pending' : 'Completed'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => {
                      setSelectedPayment(payment);
                      setShowConfirmModal(true);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                  >
                    Confirm Payment
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {pendingPayments.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <p className="text-lg">No pending payments</p>
          </div>
        )}
      </div>

      {/* Payment Confirmation Modal */}
      {showConfirmModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Confirm Payment</h2>

            <div className="space-y-4 mb-6">
              <div className="border-b pb-4">
                <p className="text-gray-600 text-sm mb-1">Order Number</p>
                <p className="text-xl font-bold text-gray-900">
                  {selectedPayment.orders.order_number}
                </p>
              </div>

              <div className="border-b pb-4">
                <p className="text-gray-600 text-sm mb-1">Amount to Receive</p>
                <p className="text-3xl font-bold text-primary">
                  ${selectedPayment.amount.toFixed(2)}
                </p>
              </div>

              <div className="border-b pb-4">
                <label className="text-gray-600 text-sm font-semibold block mb-2">
                  Transaction Reference (Optional)
                </label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="e.g., Check #, Card Last 4 digits"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-green-800 text-sm">
                  ✓ Payment will be marked as received and a receipt will be generated
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmPayment(selectedPayment)}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
              >
                Confirm & Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashierPage;
