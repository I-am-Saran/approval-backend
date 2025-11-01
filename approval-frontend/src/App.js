import React, { useState, useEffect } from 'react';
import { Camera, CheckCircle, XCircle, Eye, LogOut, Plus, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';

const API_BASE = 'https://approval-workflow-api.onrender.com';

const GlassCard = ({ children, className = '' }) => (
  <div className={`backdrop-blur-lg bg-white/10 rounded-2xl border border-white/20 shadow-2xl ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = 'primary', className = '', disabled }) => {
  const variants = {
    primary: 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700',
    success: 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700',
    danger: 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700',
    secondary: 'bg-white/20 hover:bg-white/30 border border-white/30'
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Input = ({ label, ...props }) => (
  <div className="mb-4">
    <label className="block text-white/90 mb-2 font-medium">{label}</label>
    <input
      {...props}
      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
    />
  </div>
);

const Textarea = ({ label, ...props }) => (
  <div className="mb-4">
    <label className="block text-white/90 mb-2 font-medium">{label}</label>
    <textarea
      {...props}
      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none"
      rows="4"
    />
  </div>
);



const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // Simple mock authentication - password can be anything for demo
    const mockUsers = {
      'l1@test.com': { email: 'l1@test.com', role: 'L1', name: 'L1 User' },
      'l2@test.com': { email: 'l2@test.com', role: 'L2', name: 'L2 Approver' },
      'l3@test.com': { email: 'l3@test.com', role: 'L3', name: 'L3 Approver' },
      'l0@test.com': { email: 'l0@test.com', role: 'L0', name: 'L0 Viewer' },
      'admin@test.com': { email: 'admin@test.com', role: 'admin', name: 'Admin' }
    };
    
    if (mockUsers[email] && password) {
      onLogin(mockUsers[email], 'mock-token-' + email);
    } else if (!mockUsers[email]) {
      alert('User not found. Use one of these emails:\n\nl1@test.com\nl2@test.com\nl3@test.com\nl0@test.com\nadmin@test.com\n\nPassword: any password works for demo');
    } else {
      alert('Please enter a password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <GlassCard className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-4">
            <Camera className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Approval Workflow</h1>
          <p className="text-white/70">Sign in to continue</p>
        </div>
        
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
        />
        
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter any password"
          onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
        />
        
        <Button onClick={handleLogin} className="w-full mt-6">
          Sign In
        </Button>
        
        <div className="mt-6 p-4 bg-white/5 rounded-xl">
          <p className="text-xs text-white/90 font-semibold mb-2">📧 Demo Users:</p>
          <div className="space-y-1 text-xs text-white/70">
            <p>• l1@test.com (L1 User - Create Requests)</p>
            <p>• l2@test.com (L2 Approver)</p>
            <p>• l3@test.com (L3 Approver)</p>
            <p>• l0@test.com (L0 Viewer)</p>
            <p>• admin@test.com (Admin)</p>
            <p className="mt-2 text-white/90">🔑 Password: <span className="font-semibold">any password</span></p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

const L1Dashboard = ({ user, token }) => {
  const [showForm, setShowForm] = useState(false);
  const [requests, setRequests] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    const mockRequests = [
      { id: 1, title: 'Budget Approval', description: 'Q4 Marketing Budget', status: 'pending', current_stage: 1, workflow_snapshot: ['L1', 'L2', 'L3'], created_at: '2024-10-28' },
      { id: 2, title: 'New Hire Request', description: 'Senior Developer Position', status: 'approved', current_stage: 3, workflow_snapshot: ['L1', 'L2', 'L3'], created_at: '2024-10-25' }
    ];
    setRequests(mockRequests);
  };

  const createRequest = async () => {
    if (!title || !description) {
      alert('Please fill all fields');
      return;
    }

    const newRequest = {
      id: Date.now(),
      title,
      description,
      status: 'pending',
      current_stage: 0,
      workflow_snapshot: ['L1', 'L2', 'L3'],
      created_at: new Date().toISOString().split('T')[0]
    };

    setRequests([newRequest, ...requests]);
    setTitle('');
    setDescription('');
    setShowForm(false);
    alert('Request created successfully!');
  };

  const getStageInfo = (req) => {
    const workflow = req.workflow_snapshot || ['L1', 'L2', 'L3'];
    if (req.status === 'approved') return 'Completed';
    if (req.status === 'rejected') return 'Rejected';
    if (req.current_stage < workflow.length) {
      return `At ${workflow[req.current_stage]}`;
    }
    return 'In Progress';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-white">My Requests</h2>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          New Request
        </Button>
      </div>

      {showForm && (
        <GlassCard className="p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Create New Request</h3>
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Request title"
          />
          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your request..."
          />
          <div className="flex gap-3">
            <Button onClick={createRequest}>Submit</Button>
            <Button onClick={() => setShowForm(false)} variant="secondary">Cancel</Button>
          </div>
        </GlassCard>
      )}

      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-white/90 font-semibold">ID</th>
                <th className="px-6 py-4 text-left text-white/90 font-semibold">Title</th>
                <th className="px-6 py-4 text-left text-white/90 font-semibold">Description</th>
                <th className="px-6 py-4 text-left text-white/90 font-semibold">Status</th>
                <th className="px-6 py-4 text-left text-white/90 font-semibold">Stage</th>
                <th className="px-6 py-4 text-left text-white/90 font-semibold">Created</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id} className="border-t border-white/10 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-white">{req.id}</td>
                  <td className="px-6 py-4 text-white font-medium">{req.title}</td>
                  <td className="px-6 py-4 text-white/70">{req.description}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      req.status === 'approved' ? 'bg-green-500/20 text-green-300' :
                      req.status === 'rejected' ? 'bg-red-500/20 text-red-300' :
                      'bg-yellow-500/20 text-yellow-300'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white">{getStageInfo(req)}</td>
                  <td className="px-6 py-4 text-white/70">{req.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};

const ApproverDashboard = ({ user, token }) => {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [comment, setComment] = useState('');

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    const mockRequests = [
      { id: 1, title: 'Budget Approval', description: 'Q4 Marketing Budget - $50,000 for digital campaigns', requester_email: 'l1@test.com', current_stage: user.role === 'L2' ? 1 : 2, workflow_snapshot: ['L1', 'L2', 'L3'] },
      { id: 3, title: 'Equipment Purchase', description: 'New MacBook Pro laptops for development team (5 units)', requester_email: 'l1@test.com', current_stage: user.role === 'L2' ? 1 : 2, workflow_snapshot: ['L1', 'L2', 'L3'] }
    ];
    setRequests(mockRequests);
  };

  const handleAction = async (requestId, action) => {
    const actionMsg = action === 'approve' ? '✅ Approved' : '❌ Rejected';
    alert(`${actionMsg} request #${requestId}\n${comment ? `Comment: ${comment}` : 'No comment provided'}`);
    setRequests(requests.filter(r => r.id !== requestId));
    setSelectedRequest(null);
    setComment('');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">Pending Approvals ({user.role})</h2>
        <div className="px-4 py-2 bg-white/10 rounded-xl">
          <span className="text-white/70 text-sm">Pending: </span>
          <span className="text-white font-bold text-lg">{requests.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {requests.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">All Caught Up! 🎉</h3>
              <p className="text-white/70">No pending approvals at this time</p>
            </GlassCard>
          ) : (
            requests.map((req) => (
              <GlassCard
                key={req.id}
                className={`p-6 cursor-pointer transition-all hover:scale-[1.02] ${selectedRequest?.id === req.id ? 'ring-2 ring-purple-500' : ''}`}
                onClick={() => setSelectedRequest(req)}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-semibold text-white">{req.title}</h3>
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-semibold">
                    #{req.id}
                  </span>
                </div>
                <p className="text-white/70 mb-4">{req.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">From: {req.requester_email}</span>
                  <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full">
                    Stage {req.current_stage + 1}
                  </span>
                </div>
              </GlassCard>
            ))
          )}
        </div>

        {selectedRequest && (
          <GlassCard className="p-6 h-fit sticky top-6">
            <h3 className="text-xl font-semibold text-white mb-4">Take Action</h3>
            <div className="mb-6 p-4 bg-white/5 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-white font-semibold">{selectedRequest.title}</h4>
                <span className="text-white/60 text-sm">#{selectedRequest.id}</span>
              </div>
              <p className="text-white/70 text-sm mb-3">{selectedRequest.description}</p>
              <div className="pt-3 border-t border-white/10">
                <p className="text-xs text-white/50">Requester</p>
                <p className="text-white text-sm">{selectedRequest.requester_email}</p>
              </div>
            </div>
            
            <Textarea
              label="Comment (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add your comments or feedback..."
            />
            
            <div className="flex gap-3">
              <Button
                onClick={() => handleAction(selectedRequest.id, 'approve')}
                variant="success"
                className="flex-1 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Approve
              </Button>
              <Button
                onClick={() => handleAction(selectedRequest.id, 'reject')}
                variant="danger"
                className="flex-1 flex items-center justify-center gap-2"
              >
                <XCircle className="w-5 h-5" />
                Reject
              </Button>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
};

const AdminDashboard = ({ user, token }) => {
  const [workflow, setWorkflow] = useState(['L1', 'L2', 'L3']);

  const moveUp = (index) => {
    if (index > 0) {
      const newWorkflow = [...workflow];
      [newWorkflow[index], newWorkflow[index - 1]] = [newWorkflow[index - 1], newWorkflow[index]];
      setWorkflow(newWorkflow);
    }
  };

  const moveDown = (index) => {
    if (index < workflow.length - 1) {
      const newWorkflow = [...workflow];
      [newWorkflow[index], newWorkflow[index + 1]] = [newWorkflow[index + 1], newWorkflow[index]];
      setWorkflow(newWorkflow);
    }
  };

  const removeStage = (index) => {
    if (workflow.length <= 1) {
      alert('Cannot remove the last stage');
      return;
    }
    setWorkflow(workflow.filter((_, i) => i !== index));
  };

  const addStage = () => {
    const role = prompt('Enter role (L1, L2, or L3):');
    if (role && ['L1', 'L2', 'L3'].includes(role.toUpperCase())) {
      setWorkflow([...workflow, role.toUpperCase()]);
    } else if (role) {
      alert('Invalid role. Please enter L1, L2, or L3');
    }
  };

  const saveWorkflow = async () => {
    alert('✅ Workflow saved successfully!\n\nNew workflow: ' + workflow.join(' → ') + '\n\nThis will apply to all new requests.');
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-white">Workflow Configuration</h2>

      <GlassCard className="p-6">
        <h3 className="text-xl font-semibold text-white mb-2">Approval Flow Order</h3>
        <p className="text-white/70 mb-6">Configure the order of approval stages. New requests will follow this workflow.</p>

        <div className="space-y-3 mb-6">
          {workflow.map((role, index) => (
            <div key={index} className="flex items-center gap-3 bg-white/5 p-4 rounded-xl hover:bg-white/10 transition-all">
              <div className="flex-1 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-bold">{index + 1}</span>
                </div>
                <span className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white font-semibold">
                  {role}
                </span>
                {index < workflow.length - 1 && (
                  <span className="text-white/50 ml-2">→</span>
                )}
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move up"
                >
                  <ArrowUp className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={() => moveDown(index)}
                  disabled={index === workflow.length - 1}
                  className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move down"
                >
                  <ArrowDown className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={() => removeStage(index)}
                  disabled={workflow.length <= 1}
                  className="p-2 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Remove stage"
                >
                  <Trash2 className="w-5 h-5 text-red-300" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Button onClick={addStage} variant="secondary" className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Stage
          </Button>
          <Button onClick={saveWorkflow}>💾 Save Workflow</Button>
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Current Workflow Preview</h3>
        <div className="flex items-center gap-3 flex-wrap">
          {workflow.map((role, index) => (
            <React.Fragment key={index}>
              <div className="px-5 py-3 bg-white/10 rounded-lg text-white font-semibold border border-white/20">
                {role}
              </div>
              {index < workflow.length - 1 && (
                <span className="text-white/50 text-2xl">→</span>
              )}
            </React.Fragment>
          ))}
        </div>
        <p className="text-white/60 text-sm mt-4">
          ℹ️ Existing requests continue with their original workflow. Only new requests will use this flow.
        </p>
      </GlassCard>
    </div>
  );
};

const L0Dashboard = ({ user, token }) => {
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    const mockRequests = [
      { id: 1, title: 'Budget Approval', status: 'pending', requester_email: 'l1@test.com', created_at: '2024-10-28', current_stage: 1 },
      { id: 2, title: 'New Hire Request', status: 'approved', requester_email: 'l1@test.com', created_at: '2024-10-25', current_stage: 3 },
      { id: 3, title: 'Equipment Purchase', status: 'pending', requester_email: 'l1@test.com', created_at: '2024-10-27', current_stage: 2 },
      { id: 4, title: 'Office Renovation', status: 'rejected', requester_email: 'l1@test.com', created_at: '2024-10-26', current_stage: 1 }
    ];
    
    setRequests(mockRequests);
    setStats({
      total: mockRequests.length,
      pending: mockRequests.filter(r => r.status === 'pending').length,
      approved: mockRequests.filter(r => r.status === 'approved').length,
      rejected: mockRequests.filter(r => r.status === 'rejected').length
    });
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-3xl font-bold text-white flex items-center gap-3">
        <Eye className="w-8 h-8" />
        Dashboard Overview
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard className="p-6 hover:scale-105 transition-transform">
          <div className="text-white/70 mb-2 text-sm">Total Requests</div>
          <div className="text-4xl font-bold text-white">{stats.total}</div>
          <div className="mt-2 text-xs text-white/50">All time</div>
        </GlassCard>
        <GlassCard className="p-6 hover:scale-105 transition-transform">
          <div className="text-white/70 mb-2 text-sm">Pending</div>
          <div className="text-4xl font-bold text-yellow-300">{stats.pending}</div>
          <div className="mt-2 text-xs text-yellow-300/70">In progress</div>
        </GlassCard>
        <GlassCard className="p-6 hover:scale-105 transition-transform">
          <div className="text-white/70 mb-2 text-sm">Approved</div>
          <div className="text-4xl font-bold text-green-300">{stats.approved}</div>
          <div className="mt-2 text-xs text-green-300/70">Completed</div>
        </GlassCard>
        <GlassCard className="p-6 hover:scale-105 transition-transform">
          <div className="text-white/70 mb-2 text-sm">Rejected</div>
          <div className="text-4xl font-bold text-red-300">{stats.rejected}</div>
          <div className="mt-2 text-xs text-red-300/70">Declined</div>
        </GlassCard>
      </div>

      <GlassCard className="overflow-hidden">
        <div className="p-4 bg-white/5 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">All Requests</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-white/90 font-semibold">ID</th>
                <th className="px-6 py-4 text-left text-white/90 font-semibold">Title</th>
                <th className="px-6 py-4 text-left text-white/90 font-semibold">Requester</th>
                <th className="px-6 py-4 text-left text-white/90 font-semibold">Status</th>
                <th className="px-6 py-4 text-left text-white/90 font-semibold">Stage</th>
                <th className="px-6 py-4 text-left text-white/90 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id} className="border-t border-white/10 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-white font-semibold">#{req.id}</td>
                  <td className="px-6 py-4 text-white">{req.title}</td>
                  <td className="px-6 py-4 text-white/70">{req.requester_email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      req.status === 'approved' ? 'bg-green-500/20 text-green-300' :
                      req.status === 'rejected' ? 'bg-red-500/20 text-red-300' :
                      'bg-yellow-500/20 text-yellow-300'
                    }`}>
                      {req.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white">
                    {req.status === 'approved' ? 'Completed' : 
                     req.status === 'rejected' ? 'Stopped' : 
                     `Stage ${req.current_stage}`}
                  </td>
                  <td className="px-6 py-4 text-white/70">{req.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const handleLogin = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      {!user ? (
        <LoginPage onLogin={handleLogin} />
      ) : (
        <>
          <nav className="backdrop-blur-lg bg-white/10 border-b border-white/20 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white">Approval System</h1>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-white font-semibold">{user.name}</div>
                  <div className="text-white/70 text-sm">{user.role}</div>
                </div>
                <Button onClick={handleLogout} variant="secondary" className="flex items-center gap-2">
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </div>
            </div>
          </nav>

          <div className="max-w-7xl mx-auto">
            {user.role === 'L1' && <L1Dashboard user={user} token={token} />}
            {(user.role === 'L2' || user.role === 'L3') && <ApproverDashboard user={user} token={token} />}
            {user.role === 'admin' && <AdminDashboard user={user} token={token} />}
            {user.role === 'L0' && <L0Dashboard user={user} token={token} />}
          </div>
        </>
      )}
    </div>
  );
}
