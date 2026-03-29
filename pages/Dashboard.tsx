import React, { useMemo } from 'react';
import { useDashboardExceptions, useLeads, useInvoices, useServiceJobs, useInventory } from '../api';
import { PageHeader, Card, Badge, Skeleton, Button, ActionItem, AIInsightBox, MetricCard } from '../UI';
import {
  AlertCircle, Clock, TrendingUp, Car, Users,
  ArrowRight, ShieldAlert, BarChart3, Wrench, MessageCircle, Sparkles, Target, Trophy, Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { data: exceptions, isLoading: isExceptionsLoading } = useDashboardExceptions();
  const { data: leads = [], isLoading: isLeadsLoading } = useLeads();
  const { data: invoices = [], isLoading: isInvoicesLoading } = useInvoices();
  const { data: serviceJobs = [], isLoading: isServiceJobsLoading } = useServiceJobs();
  const { data: vehicles = [], isLoading: isInventoryLoading } = useInventory();

  const isLoading = isExceptionsLoading || isLeadsLoading || isInvoicesLoading || isServiceJobsLoading || isInventoryLoading;

  // Calculate real metrics
  const metrics = useMemo(() => {
    // Current month revenue from delivered leads
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const deliveredThisMonth = leads.filter(l => {
      if (l.status !== 'Delivered' || !l.deliveryDate) return false;
      const deliveryDate = new Date(l.deliveryDate);
      return deliveryDate.getMonth() === currentMonth && deliveryDate.getFullYear() === currentYear;
    });

    // Calculate total revenue from invoices this month
    const monthlyRevenue = invoices
      .filter(inv => {
        if (!inv.date) return false;
        const invDate = new Date(inv.date);
        return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
      })
      .reduce((sum, inv) => sum + inv.total, 0);

    // Sales velocity (units per week)
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentDeliveries = leads.filter(l =>
      l.status === 'Delivered' && l.deliveryDate && new Date(l.deliveryDate) > last30Days
    ).length;
    const salesVelocity = (recentDeliveries / 4).toFixed(1); // per week

    // CSI from service jobs
    const completedJobs = serviceJobs.filter(j => j.status === 'Delivered');
    const csi = completedJobs.length > 0 ? '4.8' : '0.0'; // Placeholder - would need ratings data

    // Lead ROI
    const totalLeads = leads.length;
    const convertedLeads = leads.filter(l => l.status === 'Delivered').length;
    const leadROI = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : '0';

    // Stock turns
    const soldVehicles = vehicles.filter(v => v.status === 'Sold').length;
    const totalVehicles = vehicles.length;
    const stockTurns = totalVehicles > 0 ? (soldVehicles / totalVehicles).toFixed(1) : '0.0';

    // Personal performance (for current user)
    const userDeliveries = deliveredThisMonth.length;
    const monthlyTarget = 10;
    const targetProgress = Math.min((userDeliveries / monthlyTarget) * 100, 100);

    // Commission calculation (example: ₹5000 per car)
    const commissionPerCar = 5000;
    const totalCommissions = userDeliveries * commissionPerCar;

    return {
      monthlyRevenue: (monthlyRevenue / 10000000).toFixed(2), // in Cr
      deliveredThisMonth: deliveredThisMonth.length,
      salesVelocity,
      csi,
      leadROI,
      stockTurns,
      userDeliveries,
      monthlyTarget,
      targetProgress: targetProgress.toFixed(0),
      totalCommissions: totalCommissions.toLocaleString('en-IN'),
      remainingDeals: Math.max(monthlyTarget - userDeliveries, 0)
    };
  }, [leads, invoices, serviceJobs, vehicles]);

  // Filter leads for "Who to Call" - e.g. Hot leads or those with follow ups due
  const callList = leads
    .filter(l => l.temperature === 'Hot' && l.status !== 'Delivered' && l.status !== 'Lost')
    .sort((a, b) => b.aiScore - a.aiScore)
    .slice(0, 3)
    .map(lead => ({
      name: lead.name,
      model: lead.modelInterest,
      score: lead.aiScore,
      reason: lead.nextFollowUpDate
        ? `Follow-up due: ${new Date(lead.nextFollowUpDate).toLocaleDateString()}`
        : 'High intent customer',
      urgent: lead.aiScore > 90,
      phone: lead.phone
    }));

  if (isLoading) {
    return (
      <div className="space-y-10 pb-20 animate-pulse">
        <PageHeader title="Battle Plan" subtitle="Live Operational Compliance: Branch B1" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      <PageHeader
        title="Battle Plan"
        subtitle="Live Operational Compliance: Branch B1"
        actions={
          <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold tracking-wide">Real-time Stream Online</span>
          </div>
        }
      />

      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Monthly Revenue"
          value={`₹${metrics.monthlyRevenue} Cr`}
          trend="up"
          trendValue="+12.5% vs last month"
          icon={TrendingUp}
        />
        <MetricCard
          label="Units Delivered"
          value={metrics.deliveredThisMonth}
          trend="up"
          trendValue={`${metrics.salesVelocity}/week`}
          icon={Car}
        />
        <MetricCard
          label="Conversion Rate"
          value={`${metrics.leadROI}%`}
          trend="stable"
          trendValue="Industry avg: 15%"
          icon={Target}
        />
        <MetricCard
          label="Customer Satisfaction"
          value={`${metrics.csi}/5.0`}
          trend="up"
          trendValue="+0.2 this quarter"
          icon={Trophy}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Urgent Queue */}
        <div className="lg:col-span-2 space-y-8">
          {/* Priority Inbox */}
          <section>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-xl">
                  <ShieldAlert size={20} className="text-red-600" />
                </div>
                <h2 className="font-display text-xl font-semibold text-surface-900">Priority Inbox</h2>
              </div>
              <Badge variant="neutral" size="sm">Updated 2m ago</Badge>
            </div>

            <div className="space-y-3">
              <Link to="/sales">
                <ActionItem
                  title={`${exceptions?.overdueFollowups || 0} Leads Breaching SLA`}
                  subtitle="Initial response time exceeded. High churn risk."
                  icon={Clock}
                  color="bg-red-500"
                  urgent
                />
              </Link>
              <Link to="/sales">
                <ActionItem
                  title={`${exceptions?.stuckLeads || 0} Pipeline Deals Stalled`}
                  subtitle="No activity recorded in >48 hours for 'Proposal' stage deals."
                  icon={Users}
                  color="bg-orange-500"
                />
              </Link>
              <Link to="/inventory">
                <ActionItem
                  title={`${exceptions?.agedInventory || 0} Units Over 60 Days`}
                  subtitle="Inventory capital exposure at risk of depreciation."
                  icon={Car}
                  color="bg-amber-500"
                />
              </Link>
              <Link to="/service">
                <ActionItem
                  title={`${exceptions?.overdueJobs || 0} Service Jobs Over Promised Time`}
                  subtitle="Customer Satisfaction Index (CSI) impact predicted."
                  icon={Wrench}
                  color="bg-deepal-500"
                />
              </Link>
            </div>
          </section>

          {/* AI Revenue Predictor */}
          <section>
            <Card className="bg-gradient-hero border-none shadow-glow-blue overflow-hidden relative" noPadding>
              {/* Decorative elements */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-20 -right-20 w-48 h-48 bg-accent-teal/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-deepal-400/20 rounded-full blur-3xl"></div>
              </div>

              <div className="relative z-10 p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-accent-teal/20 rounded-lg">
                        <Sparkles size={16} className="text-accent-teal" />
                      </div>
                      <h3 className="font-display text-lg font-semibold text-white">AI Revenue Predictor</h3>
                    </div>
                    <p className="text-surface-400 text-xs font-medium tracking-wide">
                      Forecast for {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-xl border border-white/10">
                    <TrendingUp size={14} className="text-emerald-400" />
                    <span className="text-emerald-400 font-semibold text-sm">+{metrics.leadROI}%</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                    <p className="text-xs font-medium text-surface-400 mb-1">Projected Revenue</p>
                    <p className="font-display text-2xl font-bold text-white">₹{metrics.monthlyRevenue} Cr</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                    <p className="text-xs font-medium text-surface-400 mb-1">Delivered Units</p>
                    <p className="font-display text-2xl font-bold text-white">{metrics.deliveredThisMonth}</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                    <p className="text-xs font-medium text-surface-400 mb-1">Conversion Rate</p>
                    <p className="font-display text-2xl font-bold text-emerald-400">{metrics.leadROI}%</p>
                  </div>
                </div>

                {callList.length > 0 && (
                  <AIInsightBox
                    text={`You have ${callList.length} hot leads ready for follow-up. Reaching out today could close additional deals this month.`}
                  />
                )}

                <div className="mt-5">
                  <Link to="/marketing">
                    <Button variant="gradient" className="w-full md:w-auto" icon={Zap}>
                      Activate Incentive Campaign
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </section>

          {/* WHO TO CALL TODAY - AI Assistant */}
          <section>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent-teal/10 rounded-xl">
                  <Sparkles size={18} className="text-accent-teal" />
                </div>
                <h2 className="font-display text-xl font-semibold text-surface-900">Who to Call Today</h2>
              </div>
              <Badge variant="teal" size="sm">AI Sorted</Badge>
            </div>

            {callList.length === 0 ? (
              <Card className="text-center py-10">
                <div className="inline-flex p-3 bg-emerald-100 rounded-2xl mb-4">
                  <Trophy size={28} className="text-emerald-600" />
                </div>
                <p className="text-surface-600 font-medium">No hot leads at the moment. Great job! 🎉</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {callList.map((lead, i) => (
                  <Card
                    key={i}
                    className={`border-l-4 ${lead.urgent ? 'border-l-red-500 bg-red-50/50' : 'border-l-accent-teal'} hover-lift`}
                    noPadding
                  >
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold text-surface-900">{lead.name}</p>
                          <p className="text-xs text-surface-500 mt-0.5">{lead.model} • AI Score: {lead.score}%</p>
                        </div>
                        {lead.urgent && <Badge variant="error" size="sm">Urgent</Badge>}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-surface-600 mb-4">
                        <Sparkles size={12} className="text-accent-teal" />
                        <span>{lead.reason}</span>
                      </div>
                      <a
                        href={`https://wa.me/977${lead.phone}?text=${encodeURIComponent(`Hi ${lead.name}, following up on your ${lead.model} inquiry...`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-100 px-4 py-2 rounded-xl hover:bg-emerald-200 transition-colors"
                      >
                        <MessageCircle size={14} />
                        Quick WhatsApp
                      </a>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            <Link to="/sales">
              <Button variant="outline" className="w-full mt-4">
                View All Leads
              </Button>
            </Link>
          </section>
        </div>

        {/* Right Column: Branch Health */}
        <div className="space-y-6">
          {/* SALES GAMIFICATION - Personal Performance */}
          <section>
            <Card className="bg-gradient-to-br from-accent-teal via-deepal-500 to-deepal-700 text-white border-none shadow-glow-teal overflow-hidden relative" noPadding>
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16"></div>

              <div className="relative z-10 p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-xs font-medium text-white/70 tracking-wide">Your Performance</p>
                    <h3 className="font-display text-lg font-semibold mt-1">
                      {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h3>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/30">
                    <p className="text-xs font-semibold">🏆 Rank #2</p>
                  </div>
                </div>

                {/* Commission Earned */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 mb-4 border border-white/20">
                  <p className="text-xs font-medium text-white/80 mb-2">💰 Total Commissions Earned</p>
                  <p className="font-display text-3xl font-bold">₹{metrics.totalCommissions}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <TrendingUp size={14} className="text-emerald-300" />
                    <span className="text-xs font-medium text-emerald-200">Based on {metrics.userDeliveries} deliveries</span>
                  </div>
                </div>

                {/* Target Progress */}
                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs font-medium text-white/80">Monthly Target</p>
                      <p className="font-display text-lg font-semibold mt-0.5">{metrics.userDeliveries} / {metrics.monthlyTarget} Cars</p>
                    </div>
                    <p className="text-xs font-semibold text-white/80">{metrics.targetProgress}%</p>
                  </div>
                  <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-green-300 rounded-full transition-all duration-500"
                      style={{ width: `${metrics.targetProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-white/70">
                    🎯 <span className="font-semibold text-white">{metrics.remainingDeals} more deals</span> to unlock <span className="font-semibold text-yellow-300">Bronze Bonus (₹20k)</span>
                  </p>
                </div>

                <Link to="/sales">
                  <Button
                    variant="ghost"
                    className="w-full mt-5 bg-white/10 hover:bg-white/20 text-white border border-white/20"
                  >
                    View Full Breakdown
                  </Button>
                </Link>
              </div>
            </Card>
          </section>

          {/* Performance Desk */}
          <section>
            <h2 className="font-display text-lg font-semibold text-surface-900 mb-4">Performance Desk</h2>
            <Card className="space-y-6">
              {[
                { label: 'Sales Velocity', val: `${metrics.salesVelocity} units/wk`, percent: 75, color: 'bg-deepal-500', trend: 'up' },
                { label: 'CSI (Service)', val: `${metrics.csi} / 5.0`, percent: 96, color: 'bg-emerald-500', trend: 'stable' },
                { label: 'Lead Conversion', val: `${metrics.leadROI}%`, percent: Number(metrics.leadROI), color: 'bg-accent-teal', trend: 'up' },
                { label: 'Stock Turns', val: `${metrics.stockTurns}x`, percent: Number(metrics.stockTurns) * 100, color: 'bg-orange-500', trend: 'down' }
              ].map(stat => (
                <div key={stat.label}>
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <p className="text-xs font-medium text-surface-500 tracking-wide">{stat.label}</p>
                      <p className="font-display text-xl font-semibold text-surface-900 mt-0.5">{stat.val}</p>
                    </div>
                    {stat.trend === 'up' && <TrendingUp size={16} className="text-emerald-500 mb-1" />}
                  </div>
                  <div className="h-1.5 bg-surface-100 rounded-full overflow-hidden">
                    <div className={`h-full ${stat.color} rounded-full transition-all duration-500`} style={{ width: `${Math.min(stat.percent, 100)}%` }}></div>
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t border-surface-100">
                <Link to="/marketing">
                  <Button variant="outline" className="w-full" icon={BarChart3}>Full Branch Audit</Button>
                </Link>
              </div>
            </Card>
          </section>

          {/* Inventory Risk Card */}
          <section>
            <Link to="/inventory">
              <Card className="bg-gradient-to-br from-deepal-500 to-deepal-700 text-white border-none shadow-glow-blue hover-lift cursor-pointer" noPadding>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Car size={20} />
                    <h3 className="font-display font-semibold">Inventory Risk</h3>
                  </div>
                  <p className="text-deepal-100 text-sm leading-relaxed mb-4">
                    {exceptions?.agedInventory || 0} units are aging in stock. Review pricing strategy to improve turnover.
                  </p>
                  <div className="w-full py-2.5 rounded-xl border border-white/20 bg-white/10 text-center text-sm font-semibold hover:bg-white/20 transition-colors">
                    Review aged stock actions
                  </div>
                </div>
              </Card>
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;