import React, { useState, useEffect } from 'react';
import {
  Bed,
  Users,
  Calendar,
  Clock,
  DollarSign,
  Star,
  MapPin,
  Wifi,
  Car,
  Coffee,
  Tv,
  Wind,
  Bath,
  Maximize2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Save,
  X,
  User,
  CreditCard,
  Key,
  Bell,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Settings,
  Image,
  Camera,
  Heart,
  Home,
  Building,
  DoorOpen,
  DoorClosed,
  Cleaning,
  Wrench,
  Phone,
  Mail,
  Globe,
  Check,
  ChevronRight,
  ChevronDown
} from 'lucide-react';

interface Room {
  id: string;
  number: string;
  type: 'single' | 'double' | 'suite' | 'deluxe' | 'family';
  floor: number;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance' | 'cleaning';
  pricePerNight: number;
  capacity: number;
  amenities: string[];
  description: string;
  images: string[];
  lastCleaned?: Date;
  currentBooking?: Booking;
  features: {
    hasWifi: boolean;
    hasAirConditioning: boolean;
    hasTv: boolean;
    hasMinibar: boolean;
    hasBalcony: boolean;
    hasBathroom: boolean;
    hasParking: boolean;
    hasRoomService: boolean;
  };
  rating?: number;
  reviews?: number;
}

interface Booking {
  id: string;
  roomId: string;
  roomNumber: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkInDate: Date;
  checkOutDate: Date;
  adults: number;
  children: number;
  totalPrice: number;
  status: 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled';
  paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded';
  specialRequests?: string;
  createdAt: Date;
  checkedInAt?: Date;
  checkedOutAt?: Date;
  notes?: string;
}

interface LodgeStats {
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  maintenanceRooms: number;
  totalRevenue: number;
  averageOccupancyRate: number;
  averagePricePerNight: number;
  totalBookings: number;
  newBookings: number;
  checkInsToday: number;
  checkOutsToday: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
}

export const LodgeManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'rooms' | 'bookings' | 'guests'>('overview');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<LodgeStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roomTypeFilter, setRoomTypeFilter] = useState<string>('all');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Sample rooms data
  useEffect(() => {
    const sampleRooms: Room[] = [
      {
        id: '1',
        number: '101',
        type: 'single',
        floor: 1,
        status: 'available',
        pricePerNight: 89.00,
        capacity: 1,
        amenities: ['WiFi', 'Air Conditioning', 'TV', 'Private Bathroom'],
        description: 'Comfortable single room with modern amenities',
        images: [],
        features: {
          hasWifi: true,
          hasAirConditioning: true,
          hasTv: true,
          hasMinibar: false,
          hasBalcony: false,
          hasBathroom: true,
          hasParking: true,
          hasRoomService: true
        },
        rating: 4.5,
        reviews: 23
      },
      {
        id: '2',
        number: '102',
        type: 'double',
        floor: 1,
        status: 'occupied',
        pricePerNight: 125.00,
        capacity: 2,
        amenities: ['WiFi', 'Air Conditioning', 'TV', 'Minibar', 'Balcony'],
        description: 'Spacious double room with balcony view',
        images: [],
        currentBooking: {
          id: 'BK-001',
          roomId: '2',
          roomNumber: '102',
          guestName: 'John Smith',
          guestEmail: 'john@email.com',
          guestPhone: '+1234567890',
          checkInDate: new Date(Date.now() - 1000 * 60 * 60 * 24),
          checkOutDate: new Date(Date.now() + 1000 * 60 * 60 * 48),
          adults: 2,
          children: 0,
          totalPrice: 250.00,
          status: 'checked-in',
          paymentStatus: 'paid',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
          checkedInAt: new Date(Date.now() - 1000 * 60 * 60 * 24)
        },
        features: {
          hasWifi: true,
          hasAirConditioning: true,
          hasTv: true,
          hasMinibar: true,
          hasBalcony: true,
          hasBathroom: true,
          hasParking: true,
          hasRoomService: true
        },
        rating: 4.7,
        reviews: 31
      },
      {
        id: '3',
        number: '201',
        type: 'suite',
        floor: 2,
        status: 'reserved',
        pricePerNight: 250.00,
        capacity: 2,
        amenities: ['WiFi', 'Air Conditioning', 'TV', 'Minibar', 'Balcony', 'Living Room', 'Kitchenette'],
        description: 'Luxury suite with separate living area',
        images: [],
        features: {
          hasWifi: true,
          hasAirConditioning: true,
          hasTv: true,
          hasMinibar: true,
          hasBalcony: true,
          hasBathroom: true,
          hasParking: true,
          hasRoomService: true
        },
        rating: 4.9,
        reviews: 18
      },
      {
        id: '4',
        number: '202',
        type: 'deluxe',
        floor: 2,
        status: 'maintenance',
        pricePerNight: 180.00,
        capacity: 2,
        amenities: ['WiFi', 'Air Conditioning', 'TV', 'Minibar'],
        description: 'Deluxe room with premium amenities',
        images: [],
        features: {
          hasWifi: true,
          hasAirConditioning: true,
          hasTv: true,
          hasMinibar: true,
          hasBalcony: false,
          hasBathroom: true,
          hasParking: true,
          hasRoomService: true
        },
        rating: 4.6,
        reviews: 12
      },
      {
        id: '5',
        number: '301',
        type: 'family',
        floor: 3,
        status: 'cleaning',
        pricePerNight: 220.00,
        capacity: 4,
        amenities: ['WiFi', 'Air Conditioning', 'TV', 'Minibar', 'Balcony', 'Extra Beds'],
        description: 'Spacious family room for up to 4 guests',
        images: [],
        lastCleaned: new Date(Date.now() - 1000 * 60 * 60 * 2),
        features: {
          hasWifi: true,
          hasAirConditioning: true,
          hasTv: true,
          hasMinibar: true,
          hasBalcony: true,
          hasBathroom: true,
          hasParking: true,
          hasRoomService: true
        },
        rating: 4.8,
        reviews: 27
      },
      {
        id: '6',
        number: '302',
        type: 'double',
        floor: 3,
        status: 'available',
        pricePerNight: 135.00,
        capacity: 2,
        amenities: ['WiFi', 'Air Conditioning', 'TV', 'Private Bathroom'],
        description: 'Cozy double room with garden view',
        images: [],
        features: {
          hasWifi: true,
          hasAirConditioning: true,
          hasTv: true,
          hasMinibar: false,
          hasBalcony: false,
          hasBathroom: true,
          hasParking: false,
          hasRoomService: true
        },
        rating: 4.4,
        reviews: 19
      },
      {
        id: '7',
        number: '303',
        type: 'single',
        floor: 3,
        status: 'occupied',
        pricePerNight: 95.00,
        capacity: 1,
        amenities: ['WiFi', 'Air Conditioning', 'TV'],
        description: 'Compact single room with essential amenities',
        images: [],
        currentBooking: {
          id: 'BK-002',
          roomId: '7',
          roomNumber: '303',
          guestName: 'Emily Johnson',
          guestEmail: 'emily@email.com',
          guestPhone: '+0987654321',
          checkInDate: new Date(Date.now() - 1000 * 60 * 60 * 48),
          checkOutDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
          adults: 1,
          children: 0,
          totalPrice: 285.00,
          status: 'checked-in',
          paymentStatus: 'paid',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72),
          checkedInAt: new Date(Date.now() - 1000 * 60 * 60 * 48)
        },
        features: {
          hasWifi: true,
          hasAirConditioning: true,
          hasTv: true,
          hasMinibar: false,
          hasBalcony: false,
          hasBathroom: true,
          hasParking: false,
          hasRoomService: true
        },
        rating: 4.2,
        reviews: 8
      },
      {
        id: '8',
        number: '304',
        type: 'deluxe',
        floor: 3,
        status: 'available',
        pricePerNight: 195.00,
        capacity: 2,
        amenities: ['WiFi', 'Air Conditioning', 'TV', 'Minibar', 'Jacuzzi'],
        description: 'Deluxe room with private jacuzzi',
        images: [],
        features: {
          hasWifi: true,
          hasAirConditioning: true,
          hasTv: true,
          hasMinibar: true,
          hasBalcony: false,
          hasBathroom: true,
          hasParking: true,
          hasRoomService: true
        },
        rating: 4.9,
        reviews: 15
      },
      {
        id: '9',
        number: '401',
        type: 'suite',
        floor: 4,
        status: 'available',
        pricePerNight: 320.00,
        capacity: 3,
        amenities: ['WiFi', 'Air Conditioning', 'TV', 'Minibar', 'Balcony', 'Living Room', 'Kitchen', 'Ocean View'],
        description: 'Premium suite with ocean view and full kitchen',
        images: [],
        features: {
          hasWifi: true,
          hasAirConditioning: true,
          hasTv: true,
          hasMinibar: true,
          hasBalcony: true,
          hasBathroom: true,
          hasParking: true,
          hasRoomService: true
        },
        rating: 5.0,
        reviews: 22
      },
      {
        id: '10',
        number: '402',
        type: 'family',
        floor: 4,
        status: 'reserved',
        pricePerNight: 245.00,
        capacity: 5,
        amenities: ['WiFi', 'Air Conditioning', 'TV', 'Minibar', 'Balcony', 'Two Bedrooms', 'Kitchen'],
        description: 'Large family suite with two bedrooms',
        images: [],
        features: {
          hasWifi: true,
          hasAirConditioning: true,
          hasTv: true,
          hasMinibar: true,
          hasBalcony: true,
          hasBathroom: true,
          hasParking: true,
          hasRoomService: true
        },
        rating: 4.7,
        reviews: 14
      }
    ];

    setRooms(sampleRooms);

    const sampleBookings: Booking[] = sampleRooms
      .filter(room => room.currentBooking)
      .map(room => room.currentBooking!);

    setBookings(sampleBookings);

    const sampleStats: LodgeStats = {
      totalRooms: sampleRooms.length,
      occupiedRooms: sampleRooms.filter(r => r.status === 'occupied').length,
      availableRooms: sampleRooms.filter(r => r.status === 'available').length,
      maintenanceRooms: sampleRooms.filter(r => r.status === 'maintenance').length,
      totalRevenue: 2150.00,
      averageOccupancyRate: 70.5,
      averagePricePerNight: 165.75,
      totalBookings: sampleBookings.length + 5,
      newBookings: 5,
      checkInsToday: 2,
      checkOutsToday: 1,
      monthlyRevenue: 45600.00,
      yearlyRevenue: 547200.00
    };

    setStats(sampleStats);
  }, []);

  const refreshData = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getRoomStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200';
      case 'occupied': return 'bg-red-100 text-red-800 border-red-200';
      case 'reserved': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'maintenance': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cleaning': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoomStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return DoorOpen;
      case 'occupied': return Users;
      case 'reserved': return Calendar;
      case 'maintenance': return Wrench;
      case 'cleaning': return Cleaning;
      default: return Home;
    }
  };

  const getRoomTypeIcon = (type: string) => {
    switch (type) {
      case 'single': return User;
      case 'double': return Users;
      case 'suite': return Star;
      case 'deluxe': return Heart;
      case 'family': return Home;
      default: return Bed;
    }
  };

  const getBookingStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'checked-in': return 'bg-green-100 text-green-800';
      case 'checked-out': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         room.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || room.status === statusFilter;
    const matchesType = roomTypeFilter === 'all' || room.type === roomTypeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'rooms', name: 'Rooms', icon: Bed },
    { id: 'bookings', name: 'Bookings', icon: Calendar },
    { id: 'guests', name: 'Guests', icon: Users }
  ];

  const roomTypes = ['all', 'single', 'double', 'suite', 'deluxe', 'family'];
  const roomStatuses = ['all', 'available', 'occupied', 'reserved', 'maintenance', 'cleaning'];

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-100">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-lg border-b border-white/20 shadow-lg sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                  <Bed className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Lodge Management
                  </h1>
                  <p className="text-xs text-gray-500">Complete Hotel & Lodge Management</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-6">
                <div className="text-center">
                  <p className="text-xs text-gray-500">Occupancy</p>
                  <p className="text-lg font-bold text-blue-600">{stats.averageOccupancyRate.toFixed(1)}%</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Today's Revenue</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Active Bookings</p>
                  <p className="text-lg font-bold text-purple-600">{stats.newBookings}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={refreshData}
                  disabled={refreshing}
                  className={`p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors ${
                    refreshing ? 'animate-spin' : ''
                  }`}
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
                <button className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
                  <Bell className="w-5 h-5" />
                </button>
                <button className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all">
                  <Plus className="w-4 h-4 mr-2" />
                  New Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <div className="w-64 bg-white/90 backdrop-blur border-r border-gray-200 overflow-y-auto">
          <nav className="p-4 space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Lodge Overview</h2>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white/90 backdrop-blur rounded-xl shadow-lg p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Rooms</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalRooms}</p>
                      <div className="flex items-center mt-1">
                        <Bed className="w-4 h-4 text-blue-500 mr-1" />
                        <span className="text-xs text-gray-500">{stats.occupiedRooms} occupied</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center">
                      <Building className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-white/90 backdrop-blur rounded-xl shadow-lg p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Occupancy Rate</p>
                      <p className="text-2xl font-bold text-green-600">{stats.averageOccupancyRate.toFixed(1)}%</p>
                      <div className="flex items-center mt-1">
                        <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                        <span className="text-xs text-green-600">+5.2% from last week</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-white/90 backdrop-blur rounded-xl shadow-lg p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Today's Revenue</p>
                      <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.totalRevenue)}</p>
                      <div className="flex items-center mt-1">
                        <DollarSign className="w-4 h-4 text-purple-500 mr-1" />
                        <span className="text-xs text-gray-500">{stats.checkInsToday} check-ins</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-white/90 backdrop-blur rounded-xl shadow-lg p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">New Bookings</p>
                      <p className="text-2xl font-bold text-orange-600">{stats.newBookings}</p>
                      <div className="flex items-center mt-1">
                        <Calendar className="w-4 h-4 text-orange-500 mr-1" />
                        <span className="text-xs text-gray-500">Pending confirmation</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-red-500 rounded-xl flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Room Status Grid */}
              <div className="bg-white/90 backdrop-blur rounded-xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Room Status Overview</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {rooms.map((room) => {
                    const StatusIcon = getRoomStatusIcon(room.status);
                    const TypeIcon = getRoomTypeIcon(room.type);
                    return (
                      <div
                        key={room.id}
                        onClick={() => {
                          setSelectedRoom(room);
                          setActiveTab('rooms');
                        }}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all transform hover:scale-105 ${getRoomStatusColor(room.status)}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-1">
                            <TypeIcon className="w-4 h-4" />
                            <span className="font-bold text-lg">{room.number}</span>
                          </div>
                          <StatusIcon className="w-4 h-4" />
                        </div>
                        <div className="text-sm">
                          <p className="capitalize">{room.type}</p>
                          <p className="font-semibold">{formatCurrency(room.pricePerNight)}/night</p>
                          {room.rating && (
                            <div className="flex items-center mt-1">
                              <Star className="w-3 h-3 text-yellow-400 fill-current" />
                              <span className="text-xs ml-1">{room.rating}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white/90 backdrop-blur rounded-xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Check-in: Room 102</p>
                      <p className="text-xs text-gray-500">John Smith - 2 nights</p>
                    </div>
                    <span className="text-xs text-gray-400">2 hours ago</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">New Booking: Room 401</p>
                      <p className="text-xs text-gray-500">Mary Johnson - 3 nights starting tomorrow</p>
                    </div>
                    <span className="text-xs text-gray-400">4 hours ago</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                    <Wrench className="w-5 h-5 text-yellow-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Maintenance: Room 202</p>
                      <p className="text-xs text-gray-500">Air conditioning repair scheduled</p>
                    </div>
                    <span className="text-xs text-gray-400">6 hours ago</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rooms Tab */}
          {activeTab === 'rooms' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Room Management</h2>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search rooms..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {roomStatuses.map(status => (
                      <option key={status} value={status}>
                        {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                  <select
                    value={roomTypeFilter}
                    onChange={(e) => setRoomTypeFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {roomTypes.map(type => (
                      <option key={type} value={type}>
                        {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setShowRoomModal(true)}
                    className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Room
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRooms.map((room) => {
                  const StatusIcon = getRoomStatusIcon(room.status);
                  const TypeIcon = getRoomTypeIcon(room.type);
                  return (
                    <div
                      key={room.id}
                      className="bg-white/90 backdrop-blur rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getRoomStatusColor(room.status)}`}>
                            <StatusIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-gray-900">{room.number}</h3>
                            <p className="text-sm text-gray-600 capitalize">{room.type} • Floor {room.floor}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setSelectedRoom(room)}
                            className="p-1 text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingRoom(room);
                              setShowRoomModal(true);
                            }}
                            className="p-1 text-gray-600 hover:text-gray-900"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Price/Night</span>
                          <span className="font-bold text-green-600">{formatCurrency(room.pricePerNight)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Capacity</span>
                          <span className="font-medium">{room.capacity} guests</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Rating</span>
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm font-medium">{room.rating}</span>
                            <span className="text-xs text-gray-500">({room.reviews})</span>
                          </div>
                        </div>

                        <div className="pt-3 border-t">
                          <p className="text-sm text-gray-600 mb-2">Amenities</p>
                          <div className="flex flex-wrap gap-1">
                            {room.features.hasWifi && <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">WiFi</span>}
                            {room.features.hasAirConditioning && <span className="px-2 py-1 bg-cyan-100 text-cyan-700 text-xs rounded">AC</span>}
                            {room.features.hasTv && <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">TV</span>}
                            {room.features.hasMinibar && <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">Minibar</span>}
                            {room.features.hasBalcony && <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Balcony</span>}
                          </div>
                        </div>

                        {room.currentBooking && (
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-blue-900">Occupied by</p>
                                <p className="text-sm text-blue-700">{room.currentBooking.guestName}</p>
                              </div>
                              <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="mt-2 text-xs text-blue-600">
                              Check-out: {room.currentBooking.checkOutDate.toLocaleDateString()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bookings Tab */}
          {activeTab === 'bookings' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Booking Management</h2>
                <button
                  onClick={() => setShowBookingModal(true)}
                  className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Booking
                </button>
              </div>

              <div className="bg-white/90 backdrop-blur rounded-xl shadow-lg border border-gray-100">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Booking Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Guest
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Dates
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {bookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{booking.id}</div>
                              <div className="text-sm text-gray-500">Room {booking.roomNumber}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{booking.guestName}</div>
                              <div className="text-sm text-gray-500">{booking.guestPhone}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm text-gray-900">
                                {booking.checkInDate.toLocaleDateString()} - {booking.checkOutDate.toLocaleDateString()}
                              </div>
                              <div className="text-sm text-gray-500">
                                {booking.adults} adults, {booking.children} children
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-gray-900">{formatCurrency(booking.totalPrice)}</div>
                            <div className={`text-xs ${getBookingStatusColor(booking.paymentStatus)}`}>
                              {booking.paymentStatus}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getBookingStatusColor(booking.status)}`}>
                              {booking.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => setSelectedBooking(booking)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button className="text-gray-600 hover:text-gray-900">
                                <Edit className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Guests Tab */}
          {activeTab === 'guests' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Guest Management</h2>
              <div className="bg-white/90 backdrop-blur rounded-xl shadow-lg p-8 border border-gray-100 text-center">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Guest Management</h3>
                <p className="text-gray-500">Guest profiles and history management coming soon...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};