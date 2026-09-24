'use client';

import React, { useState, useEffect } from 'react';
import { AdminProtectedRoute } from '@/components/admin/AdminProtectedRoute';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useToast } from '@/components/ui/toast';
import { AdminService } from '@/lib/adminService';
import { motion } from 'framer-motion';
import {
  Users, PlayCircle, Music, FileText,
  TrendingUp, Activity, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie
} from 'recharts';

// Types for the new analytics structure
interface DashboardData {
  users: {
    total: number;
    active: number;
    new: number;
    growth: number | null;
  };
  sessions: {
    total: number;
    completed: number;
    average: number;
    growth: number | null;
  };
  engagement: {
    dailyActive: number[];
    weeklyActive: number[];
    monthlyActive: number;
    participationRate: number;
  };
  meditation: {
    totalMinutes: number;
    averageSession: number;
    popularTypes: Array<{ type: string; count: number; percentage: number }>;
  };
  content: {
    audioFiles: number;
    dhammaPosts: number;
    totalViews: number;
    totalAudioListens: number;
  };
  trends: {
    userGrowth: Array<{ date: string; count: number }>;
    sessionGrowth: Array<{ date: string; count: number }>;
  };
}

export default function AdminDashboardPage() {
  const { adminUser, hasPermission } = useAdminAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const { showToast } = useToast();

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        // Fetch comprehensive analytics
        const analytics = await AdminService.getAdminAnalytics('30d');
        setData(analytics);

        showToast({
          type: 'success',
          title: 'Dashboard Updated',
          message: `Welcome back, ${adminUser?.displayName}!`,
          duration: 3000
        });
      } catch (error) {
        console.error('Error loading admin stats:', error);
        showToast({
          type: 'error',
          title: 'Error',
          message: 'Failed to load dashboard statistics',
          duration: 5000
        });
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [adminUser?.displayName, showToast, retry]);

  if (loading) {
    return (
      <AdminProtectedRoute>
        <AdminLayout currentPage="/admin/dashboard">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </AdminLayout>
      </AdminProtectedRoute>
    );
  }

  if (!data) return <AdminLayout currentPage="/admin/dashboard"><div role="alert" className="app-card p-6"><h1 className="text-xl font-semibold">Dashboard could not load</h1><p className="my-3 text-muted-foreground">Check your connection and try again.</p><Button onClick={()=>setRetry(value=>value+1)}>Retry</Button></div></AdminLayout>;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <AdminProtectedRoute>
      <AdminLayout currentPage="/admin/dashboard">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-8"
        >
          {/* Welcome Section */}
          <motion.div variants={item} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/90 to-primary p-8 text-white shadow-2xl">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-card/10 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-64 w-64 rounded-full bg-black/10 blur-3xl"></div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  Welcome back, {adminUser?.displayName}! 🙏
                </h1>
                <p className="text-primary-foreground/80 text-lg max-w-xl">
                  Here&apos;s your overview of the platform&apos;s performance and user engagement for the last 30 days.
                </p>
              </div>
              <div className="flex items-center gap-4 bg-card/10 backdrop-blur-md rounded-2xl p-4 border border-border">
                <div className="text-right">
                  <p className="text-sm text-primary-foreground/70">Current Role</p>
                  <p className="text-lg font-bold capitalize">{adminUser?.role?.replace('_', ' ')}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-card/20 flex items-center justify-center text-2xl">
                  👤
                </div>
              </div>
            </div>
          </motion.div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Total Users"
              value={data?.users.total || 0}
              subValue={`${data?.users.new || 0} new in the last 30 days`}
              icon={Users}
              color="blue"
            />
            <StatsCard
              title="Active · 30 days"
              value={data?.users.active || 0}
              subValue={`${data?.engagement.participationRate}% participation`}
              icon={Activity}
              color="green"
            />
            <StatsCard
              title="Sessions · 30 days"
              value={data?.sessions.total || 0}
              change={data?.sessions.growth}
              icon={PlayCircle}
              color="purple"
            />
            <StatsCard
              title="Practice minutes · 30 days"
              value={Math.round((data?.meditation.totalMinutes || 0))}
              label="Minutes Meditated"
              icon={TrendingUp}
              color="orange"
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* User Growth Chart */}
            <motion.div variants={item} className="lg:col-span-2 bg-card backdrop-blur-xl border border-border rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-foreground">User Growth</h3>
                  <p className="text-sm text-muted-foreground">Cumulative user growth over the last 30 days</p>
                </div>
                <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                  <TrendingUp size={20} />
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.trends.userGrowth}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorUsers)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Meditation Types Distribution */}
            <motion.div variants={item} className="bg-card backdrop-blur-xl border border-border rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-foreground">Popular Types</h3>
                  <p className="text-sm text-muted-foreground">Distribution by session count</p>
                </div>
                <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
                  <Music size={20} />
                </div>
              </div>
              <div className="h-[300px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.meditation.popularTypes}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="count"
                    >
                      {data?.meditation.popularTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Text */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">{data?.sessions.total}</p>
                    <p className="text-xs text-muted-foreground">Sessions</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {data?.meditation.popularTypes.slice(0, 3).map((type, index) => (
                  <div key={type.type} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-muted-foreground capitalize">{type.type}</span>
                    </div>
                    <span className="font-medium text-foreground">{type.percentage}%</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Content & Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Content Stats */}
            <motion.div variants={item} className="bg-card backdrop-blur-xl border border-border rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-foreground mb-6">Content Overview</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-card rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-50 rounded-xl text-orange-600">
                      <Music size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Audio Files</p>
                      <p className="text-xl font-bold text-foreground">{data?.content.audioFiles}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Listens · 30 days</p>
                    <p className="font-medium text-foreground">{data?.content.totalAudioListens.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-card rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-teal-50 rounded-xl text-teal-600">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Dhamma Posts</p>
                      <p className="text-xl font-bold text-foreground">{data?.content.dhammaPosts}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Reads · 30 days</p>
                    <p className="font-medium text-foreground">{data?.content.totalViews}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div variants={item} className="lg:col-span-2 bg-card backdrop-blur-xl border border-border rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-foreground mb-6">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {hasPermission('audio', 'create') && (
                  <Button
                    className="h-auto p-4 justify-start bg-card hover:bg-muted text-foreground border border-border shadow-sm hover:shadow-md transition-all group"
                    onClick={() => window.location.href = '/admin/audio'}
                  >
                    <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:scale-110 transition-transform mr-4">
                      <Music size={24} />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">Upload Audio</p>
                      <p className="text-xs text-muted-foreground">Add new meditation tracks</p>
                    </div>
                  </Button>
                )}

                {hasPermission('dhamma', 'create') && (
                  <Button
                    className="h-auto p-4 justify-start bg-card hover:bg-muted text-foreground border border-border shadow-sm hover:shadow-md transition-all group"
                    onClick={() => window.location.href = '/admin/dhamma'}
                  >
                    <div className="p-3 bg-teal-50 rounded-xl text-teal-600 group-hover:scale-110 transition-transform mr-4">
                      <FileText size={24} />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">Create Post</p>
                      <p className="text-xs text-muted-foreground">Write a new Dhamma article</p>
                    </div>
                  </Button>
                )}

                {hasPermission('users', 'read') && (
                  <Button
                    className="h-auto p-4 justify-start bg-card hover:bg-muted text-foreground border border-border shadow-sm hover:shadow-md transition-all group"
                    onClick={() => window.location.href = '/admin/users'}
                  >
                    <div className="p-3 bg-purple-50 rounded-xl text-purple-600 group-hover:scale-110 transition-transform mr-4">
                      <Users size={24} />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">Manage Users</p>
                      <p className="text-xs text-muted-foreground">View and edit user profiles</p>
                    </div>
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}

// Helper Components
const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

interface StatsCardProps {
  title: string;
  value: number;
  change?: number | null;
  subValue?: string;
  label?: string;
  icon: React.ElementType;
  color: string;
}

function StatsCard({ title, value, change, subValue, label, icon: Icon, color }: StatsCardProps) {
  const isPositive = (change ?? 0) >= 0;
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
      className="bg-card backdrop-blur-xl border border-border rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-2xl ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon size={24} />
        </div>
        {change != null && (
          <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'} bg-card px-2 py-1 rounded-lg`}>
            {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            {Math.abs(change ?? 0)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-foreground">{value.toLocaleString()}</h3>
        {(subValue || label) && (
          <p className="text-xs text-muted-foreground mt-2">{subValue || label}</p>
        )}
      </div>
    </motion.div>
  );
}


