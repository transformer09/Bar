import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import POSGridItem from '../components/POSGridItem';
import LoadingSpinner from '../components/LoadingSpinner';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface Guest {
  id: number;
  items: OrderItem[];
  subtotal: number;
}

const POSPage: React.FC = () => {
  const { token } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('beer');
  const [guests, setGuests] = useState<Guest[]>([{ id: 1, items: [], subtotal: 0 }]);
  const [currentGuest, setCurrentGuest] = useState(1);
  const [tableNumber, setTableNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [orderType, setOrderType] = useState<'dine_in' | 'takeout' | 'delivery'>('dine_in');

  useEffect(() => {
    fetchCategories();
    fetchItems();
  }, [token]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/pos/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setCategories(data);
      if (data.length > 0) setSelectedCategory(data[0].name);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/bar/recipes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setItems(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching items:', error);
      setLoading(false);
    }
  };

  const handleAddItem = (id: string, name: string, price: number = 0) => {
    setGuests((prevGuests) =>
      prevGuests.map((guest) => {
        if (guest.id === currentGuest) {
          const existingItem = guest.items.find((item) => item.id === id);
          if (existingItem) {
            existingItem.quantity += 1;
            existingItem.total = existingItem.quantity * existingItem.price;
          } else {
            guest.items.push({
              id,
              name,
              quantity: 1,
              price,
              total: price,
            });
          }
          guest.subtotal = guest.items.reduce((sum, item) => sum + item.total, 0);
        }
        return guest;
      })
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setGuests((prevGuests) =>
      prevGuests.map((guest) => {
        if (guest.id === currentGuest) {
          guest.items = guest.items.filter((item) => item.id !== itemId);
          guest.subtotal = guest.items.reduce((sum, item) => sum + item.total, 0);
        }
        return guest;
      })
    );
  };

  const handleQuantityChange = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }

    setGuests((prevGuests) =>
      prevGuests.map((guest) => {
        if (guest.id === currentGuest) {
          const item = guest.items.find((i) => i.id === itemId);
          if (item) {
            item.quantity = quantity;
            item.total = item.quantity * item.price;
            guest.subtotal = guest.items.reduce((sum, i) => sum + i.total, 0);
          }
        }
        return guest;
      })
    );
  };

  const addGuest = () => {
    const newGuestId = Math.max(...guests.map((g) => g.id), 0) + 1;
    setGuests([...guests, { id: newGuestId, items: [], subtotal: 0 }]);
    setCurrentGuest(newGuestId);
  };

  const currentGuestData = guests.find((g) => g.id === currentGuest) || guests[0];
  const totalAmount = guests.reduce((sum, guest) => sum + guest.subtotal, 0);
  const taxAmount = totalAmount * 0.1;
  const grandTotal = totalAmount + taxAmount;

  if (loading) return <LoadingSpinner />;

  const filteredItems = items.filter((item) => item.category === selectedCategory);

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Main POS Grid Section */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-4xl font-bold text-white">POS System</h1>
            <div className="flex gap-2">
              <select
                value={orderType}
                onChange={(e) => setOrderType(e.target.value as any)}
                className="px-4 py-2 bg-primary text-white rounded-lg font-semibold"
              >
                <option value="dine_in">Dine In</option>
                <option value="takeout">Takeout</option>
                <option value="delivery">Delivery</option>
              </select>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.name)}
                className={`
                  px-6 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 whitespace-nowrap
                  ${selectedCategory === category.name
                    ? 'bg-accent text-white shadow-lg'
                    : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  }
                `}
                style={{
                  backgroundColor:
                    selectedCategory === category.name ? category.color_hex : undefined,
                }}
              >
                <span>{category.icon_code}</span>
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-5 gap-4">
          {filteredItems.map((item) => (
            <POSGridItem
              key={item.id}
              id={item.id}
              name={item.name}
              icon={item.icon}
              price={item.base_price || 5.99}
              onClick={handleAddItem}
              buttonSize="large"
            />
          ))}
        </div>
      </div>

      {/* Right Sidebar - Order Summary */}
      <div className="w-96 bg-gray-800 border-l border-gray-700 flex flex-col">
        {/* Order Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="mb-4">
            <label className="text-gray-300 text-sm font-semibold block mb-2">
              Table Number
            </label>
            <input
              type="text"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="e.g., T-01"
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-accent focus:outline-none"
            />
          </div>

          {/* Guest Tabs */}
          <div className="flex gap-2 overflow-x-auto">
            {guests.map((guest) => (
              <button
                key={guest.id}
                onClick={() => setCurrentGuest(guest.id)}
                className={`
                  px-4 py-2 rounded-lg font-semibold transition-all text-sm
                  ${currentGuest === guest.id
                    ? 'bg-accent text-white'
                    : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  }
                `}
              >
                Guest {guest.id}
              </button>
            ))}
            <button
              onClick={addGuest}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
            >
              + Guest
            </button>
          </div>
        </div>

        {/* Order Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {currentGuestData.items.length > 0 ? (
            currentGuestData.items.map((item) => (
              <div key={item.id} className="bg-gray-700 rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-white font-semibold text-sm">{item.name}</h4>
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="text-red-400 hover:text-red-300 font-bold"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      className="px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-500"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        handleQuantityChange(item.id, parseInt(e.target.value))
                      }
                      className="w-12 px-2 py-1 bg-gray-600 text-white rounded text-center"
                    />
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      className="px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-500"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-accent font-bold">${item.total.toFixed(2)}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>No items added</p>
            </div>
          )}
        </div>

        {/* Totals and Actions */}
        <div className="p-6 border-t border-gray-700 space-y-4">
          <div className="space-y-2 bg-gray-700 rounded-lg p-4">
            <div className="flex justify-between text-gray-200">
              <span>Subtotal:</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-200">
              <span>Tax (10%):</span>
              <span>${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-accent border-t border-gray-600 pt-2 mt-2">
              <span>Total:</span>
              <span>${grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button className="py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600">
              Clear Order
            </button>
            <button className="py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">
              Confirm Order
            </button>
          </div>

          <button className="w-full py-4 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-700">
            Proceed to Payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default POSPage;
