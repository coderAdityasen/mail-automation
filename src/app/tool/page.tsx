'use client';

import { useState, useEffect } from 'react';
import { Mail, User, FileText, Paperclip, Send, CheckCircle2, AlertCircle, Loader2, Plus, Save, Sidebar, Code, Settings, X, Table, LogOut, Eye, Clock, Briefcase, ExternalLink, Search, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Editor from 'react-simple-wysiwyg';

interface Profile {
  id: string;
  name: string;
  subject: string;
  body: string;
  resume_path: string | null;
  user_id?: string;
}

interface SheetRow {
  id: string;
  email: string;
  status: 'idle' | 'sending' | 'success' | 'error';
  message?: string;
}

interface EmailLog {
  id: string;
  recipient: string;
  subject: string;
  profile_name: string;
  status: string;
  opened_at: string | null;
  created_at: string;
}

export default function Home() {
  // Auth State
  const [user, setUser] = useState<any>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authInit, setAuthInit] = useState(true);

  // App State
  const [mode, setMode] = useState<'single' | 'sheet' | 'leads'>('single');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  
  // Leads State
  const [leads, setLeads] = useState<any[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  
  // Single Form State
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  // Sheet State
  const [rows, setRows] = useState<SheetRow[]>([{ id: '1', email: '', status: 'idle' }]);

  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [smtpEmail, setSmtpEmail] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');

  // AI Tailor State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setAuthInit(false);
      if (session?.user) {
        fetchProfiles();
        fetchLogs(session.user.id);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfiles();
        fetchLogs(session.user.id);
      }
    });

    const storedEmail = localStorage.getItem('smtpEmail');
    const storedPass = localStorage.getItem('smtpPassword');
    if (storedEmail) setSmtpEmail(storedEmail);
    if (storedPass) setSmtpPassword(storedPass);

    return () => subscription.unsubscribe();
  }, []);

  // Set up real-time subscription for email logs
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel('realtime:email_logs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'email_logs', filter: `user_id=eq.${user.id}` }, (payload) => {
        fetchLogs(user.id); // Reload logs on any change
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchProfiles = async () => {
    try {
      const { data } = await supabase.from('profiles').select('*').order('name');
      if (data) setProfiles(data);
    } catch (e) {
      console.warn("Supabase not properly initialized");
    }
  };

  const fetchLogs = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('email_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (data) setEmailLogs(data);
    } catch (e) {
      console.warn("Error fetching logs");
    }
  };

  const fetchLeads = async () => {
    setLeadsLoading(true);
    try {
      const res = await fetch('https://remotive.com/api/remote-jobs?category=software-dev&limit=15');
      const data = await res.json();
      setLeads(data.jobs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLeadsLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setStatus('idle');
    setMessage('');
    
    try {
      if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
        if (error) throw error;
        setStatus('success');
        setMessage('Signup successful! (If unconfirmed, check your email)');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
        if (error) throw error;
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setProfiles([]);
    setEmailLogs([]);
    setActiveProfileId(null);
  };

  const handleSelectProfile = (profile: Profile) => {
    setActiveProfileId(profile.id);
    setSubject(profile.subject || '');
    setBody(profile.body || '');
    setFile(null);
  };

  const handleCreateNew = () => {
    setActiveProfileId(null);
    setSubject('');
    setBody('');
    setFile(null);
  };

  const handleToggleHtmlMode = () => {
    if (!isHtmlMode) {
      const htmlBody = body.replace(/\n/g, '<br>\n');
      setBody(htmlBody);
    } else {
      let plainText = body.replace(/<br\s*\/?>/gi, '\n');
      plainText = plainText.replace(/<[^>]*>?/gm, '');
      setBody(plainText);
    }
    setIsHtmlMode(!isHtmlMode);
  };

  const handleSaveProfile = async () => {
    const profileName = prompt("Enter a name for this profile (e.g. Fresher, Experienced):");
    if (!profileName) return;

    setSaving(true);
    setStatus('idle');
    try {
      let resume_path = null;

      if (file) {
        const fileExt = file.name.split('.').pop();
        const filePath = `${user?.id}/${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('resumes').upload(filePath, file);
        if (uploadError) throw uploadError;
        resume_path = filePath;
      } else if (activeProfileId) {
        const existingProfile = profiles.find(p => p.id === activeProfileId);
        resume_path = existingProfile?.resume_path || null;
      }

      const profileData = { name: profileName, subject, body, resume_path, user_id: user?.id };

      if (activeProfileId) {
        const { error } = await supabase.from('profiles').update(profileData).eq('id', activeProfileId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('profiles').insert([profileData]);
        if (error) throw error;
      }

      setMessage('Profile saved successfully!');
      setStatus('success');
      await fetchProfiles();
    } catch (error: any) {
      setMessage(`Error saving profile: ${error.message}`);
      setStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = () => {
    localStorage.setItem('smtpEmail', smtpEmail);
    localStorage.setItem('smtpPassword', smtpPassword);
    setIsSettingsOpen(false);
    setStatus('success');
    setMessage('Settings saved! You will now send emails from this account.');
    setTimeout(() => setStatus('idle'), 4000);
  };

  const createTrackingLog = async (email: string, sub: string, pName: string) => {
    if (!user) return null;
    try {
      const { data, error } = await supabase.from('email_logs').insert([{
        user_id: user.id,
        recipient: email,
        subject: sub,
        profile_name: pName,
        status: 'Sending'
      }]).select().single();
      
      if (error) throw error;
      return data.id;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const updateTrackingLog = async (id: string, status: string) => {
    if (!user || !id) return;
    await supabase.from('email_logs').update({ status }).eq('id', id);
  };

  const handleAiTailor = async () => {
    if (!jobDescription.trim()) return;
    setIsAiGenerating(true);
    try {
      const response = await fetch('/api/ai/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription, currentBody: body })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'AI generation failed');
      }
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;

      setBody('');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        // The AI SDK stream format sends specific formats. We might need to clean it if it is streamText,
        // but streamText.toDataStreamResponse() sends `0:"content"` chunks. Let's just use it and see,
        // Actually Vercel AI standard stream parts could just be appended if we clean them, 
        // or we just rely on standard text decode. The user's prompt just said "rewrite the existing body and automatically insert".
        const chunk = decoder.decode(value, { stream: true });
        
        // Clean Vercel AI SDK text stream artifacts if they exist (0:"...")
        const cleanedChunk = chunk.split('\\n').map(line => {
            if (line.startsWith('0:')) {
                try {
                    return JSON.parse(line.substring(2));
                } catch { return line; }
            }
            return line;
        }).join('');

        setBody(prev => prev + cleanedChunk);
      }
      
      setIsAiModalOpen(false);
      setJobDescription('');
    } catch (error: any) {
      console.error(error);
      alert(`Failed to generate AI response: ${error.message}`);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleSubmitSingle = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!smtpEmail || !smtpPassword) {
      setIsSettingsOpen(true);
      setStatus('error');
      setMessage('Please configure your Gmail account first.');
      return;
    }

    setLoading(true);
    setStatus('idle');
    setMessage('');

    const activeProfile = profiles.find(p => p.id === activeProfileId);
    const pName = activeProfile?.name || 'Manual Entry';

    const trackingId = await createTrackingLog(recipient, subject, pName);

    const formData = new FormData();
    formData.append('recipient', recipient);
    formData.append('subject', subject);
    formData.append('body', body);
    formData.append('isHtml', String(isHtmlMode));
    formData.append('smtpEmail', smtpEmail);
    formData.append('smtpPassword', smtpPassword);
    if (trackingId) formData.append('trackingId', trackingId);
    
    if (file) {
      formData.append('file', file);
    } else if (activeProfile) {
      if (activeProfile.resume_path) formData.append('resumePath', activeProfile.resume_path);
    }

    try {
      const res = await fetch('/api/send', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        if (trackingId) await updateTrackingLog(trackingId, 'Sent');
        setStatus('success');
        setMessage('Email sent successfully!');
        setRecipient('');
      } else {
        if (trackingId) await updateTrackingLog(trackingId, 'Error');
        setStatus('error');
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      if (trackingId) await updateTrackingLog(trackingId, 'Error');
      setStatus('error');
      setMessage('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleRowBlur = async (rowId: string, email: string) => {
    if (!email.trim() || !email.includes('@')) return; 
    
    if (!activeProfileId) {
      alert("Please select a profile from the sidebar first.");
      return;
    }
    
    if (!smtpEmail || !smtpPassword) {
      setIsSettingsOpen(true);
      return;
    }

    const rowIdx = rows.findIndex(r => r.id === rowId);
    if (rows[rowIdx].status === 'success' || rows[rowIdx].status === 'sending') return;

    setRows(prev => prev.map(r => r.id === rowId ? { ...r, status: 'sending', email } : r));

    const activeProfile = profiles.find(p => p.id === activeProfileId);
    const trackingId = await createTrackingLog(email, subject, activeProfile?.name || 'Sheet Entry');

    const formData = new FormData();
    formData.append('recipient', email);
    formData.append('subject', subject);
    formData.append('body', body);
    formData.append('isHtml', String(isHtmlMode));
    formData.append('smtpEmail', smtpEmail);
    formData.append('smtpPassword', smtpPassword);
    if (trackingId) formData.append('trackingId', trackingId);
    
    if (activeProfile?.resume_path) {
      formData.append('resumePath', activeProfile.resume_path);
    }

    try {
      const res = await fetch('/api/send', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        if (trackingId) await updateTrackingLog(trackingId, 'Sent');
        setRows(prev => {
          const newRows = prev.map(r => r.id === rowId ? { ...r, status: 'success' as const, message: 'Sent' } : r);
          if (rowIdx === prev.length - 1) {
            newRows.push({ id: Math.random().toString(), email: '', status: 'idle' });
          }
          return newRows;
        });
      } else {
        if (trackingId) await updateTrackingLog(trackingId, 'Error');
        setRows(prev => prev.map(r => r.id === rowId ? { ...r, status: 'error', message: data.error } : r));
      }
    } catch (error) {
      if (trackingId) await updateTrackingLog(trackingId, 'Error');
      setRows(prev => prev.map(r => r.id === rowId ? { ...r, status: 'error', message: 'Failed to send' } : r));
    }
  };

  const updateRowEmail = (id: string, email: string) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, email } : r));
  };

  const activeProfile = profiles.find(p => p.id === activeProfileId);

  // Loading Screen
  if (authInit) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  // Auth Guard
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans relative">
        <div className="absolute top-4 left-4">
          <Link href="/" className="text-gray-500 hover:text-blue-600 font-medium text-sm flex items-center">← Back to Home</Link>
        </div>
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-lg"><Mail className="w-6 h-6 text-white" /></div>
          </div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            {authMode === 'login' ? 'Sign in to MailMate' : 'Create an Account'}
          </h2>
        </div>
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100">
            <form className="space-y-6" onSubmit={handleAuth}>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email address</label>
                <div className="mt-1">
                  <input type="email" required value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <div className="mt-1">
                  <input type="password" required value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </div>
              </div>
              <div>
                <button type="submit" disabled={authLoading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                  {authLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (authMode === 'login' ? 'Sign in' : 'Sign up')}
                </button>
              </div>
            </form>
            {status !== 'idle' && (
              <div className={`mt-4 rounded-lg p-3 flex items-center ${status === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                <p className="text-sm font-medium">{message}</p>
              </div>
            )}
            <div className="mt-6 text-center">
              <button onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setStatus('idle'); }} className="text-sm text-blue-600 hover:text-blue-500 font-medium">
                {authMode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="h-screen bg-gray-50 flex font-sans relative overflow-hidden">
      
      {/* AI Tailor Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50 shrink-0">
              <h3 className="font-bold text-gray-800 text-lg flex items-center"><Sparkles className="w-5 h-5 mr-2 text-purple-600" /> AI Tailor Email</h3>
              <button onClick={() => setIsAiModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <p className="text-sm text-gray-600 mb-4">Paste the job description below. The AI will rewrite your current email body to highlight how your skills match the role.</p>
              <textarea 
                rows={8} 
                className="w-full rounded-lg border border-gray-300 p-4 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-500 resize-none" 
                placeholder="Paste job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3 shrink-0">
              <button onClick={() => setIsAiModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800">Cancel</button>
              <button 
                onClick={handleAiTailor} 
                disabled={isAiGenerating || !jobDescription.trim()} 
                className="px-5 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center disabled:opacity-50"
              >
                {isAiGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</> : 'Generate & Insert'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-gray-800 text-lg flex items-center"><Settings className="w-5 h-5 mr-2 text-gray-600" /> SMTP Settings</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 mb-4">Configure your own Gmail account. Details are saved securely in your browser.</p>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Gmail Address</label>
                <input type="email" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500" value={smtpEmail} onChange={(e) => setSmtpEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">App Password</label>
                <input type="password" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500" value={smtpPassword} onChange={(e) => setSmtpPassword(e.target.value)} />
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3">
              <button onClick={() => setIsSettingsOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800">Cancel</button>
              <button onClick={handleSaveSettings} className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg">Save Settings</button>
            </div>
          </div>
        </div>
      )}

      {/* Left Sidebar - Profiles */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex shrink-0">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center">
            <Sidebar className="w-5 h-5 text-gray-500 mr-2" />
            <h1 className="font-semibold text-gray-700">Profiles</h1>
          </div>
          <button onClick={handleLogout} title="Log out" className="text-gray-400 hover:text-red-500 transition-colors"><LogOut className="w-4 h-4" /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {profiles.map(profile => (
            <button key={profile.id} onClick={() => handleSelectProfile(profile)} className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeProfileId === profile.id ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'text-gray-600 hover:bg-gray-100'}`}>
              {profile.name}
            </button>
          ))}
          {profiles.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No profiles saved yet.</p>}
        </div>

        <div className="p-4 border-t border-gray-200 space-y-3">
          <button onClick={handleCreateNew} className="w-full flex items-center justify-center px-4 py-2 border border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:border-gray-400">
            <Plus className="w-4 h-4 mr-2" /> New Profile
          </button>
          <button onClick={() => setIsSettingsOpen(true)} className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200">
            <Settings className="w-4 h-4 mr-2" /> Settings
          </button>
        </div>
      </div>

      {/* Center - Main Content Area */}
      <div className="flex-1 flex flex-col p-4 sm:p-8 overflow-y-auto border-r border-gray-200">
        <div className="max-w-3xl w-full mx-auto">
          
          <div className="flex bg-gray-200 p-1 rounded-lg mb-6 w-fit mx-auto">
            <button onClick={() => setMode('single')} className={`flex items-center px-6 py-2 rounded-md text-sm font-semibold transition-all ${mode === 'single' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <Send className="w-4 h-4 mr-2" /> Single Send
            </button>
            <button onClick={() => setMode('sheet')} className={`flex items-center px-6 py-2 rounded-md text-sm font-semibold transition-all ${mode === 'sheet' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <Table className="w-4 h-4 mr-2" /> Sheet Automation
            </button>
            <button onClick={() => { setMode('leads'); if(leads.length === 0) fetchLeads(); }} className={`flex items-center px-6 py-2 rounded-md text-sm font-semibold transition-all ${mode === 'leads' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <Search className="w-4 h-4 mr-2" /> Find Jobs
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-8 text-white text-center relative">
              <h2 className="text-2xl font-bold tracking-tight">{activeProfile ? `Active: ${activeProfile.name}` : (mode === 'single' ? 'Create Application' : 'Sheet Automation')}</h2>
              <p className="mt-1 text-blue-100 text-sm max-w-sm mx-auto">{mode === 'single' ? 'Send a single tailored email manually.' : 'Enter HR emails below. We auto-send instantly.'}</p>
            </div>

            {mode === 'single' ? (
              <div className="px-8 py-8">
                <form onSubmit={handleSubmitSingle} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 relative">
                      <label className="block text-sm font-semibold text-gray-700">Recipient Email</label>
                      <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User className="h-5 w-5 text-gray-400" /></div>
                        <input type="email" required className="pl-10 block w-full rounded-lg border border-gray-300 px-4 py-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500" value={recipient} onChange={(e) => setRecipient(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-2 relative">
                      <label className="block text-sm font-semibold text-gray-700">Subject Line</label>
                      <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FileText className="h-5 w-5 text-gray-400" /></div>
                        <input type="text" required className="pl-10 block w-full rounded-lg border border-gray-300 px-4 py-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500" value={subject} onChange={(e) => setSubject(e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="block text-sm font-semibold text-gray-700">Message Body</label>
                      <button type="button" onClick={handleToggleHtmlMode} className={`flex items-center text-xs px-3 py-1.5 rounded-full font-medium ${isHtmlMode ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}><Code className="w-3.5 h-3.5 mr-1" /> HTML Mode</button>
                    </div>
                    {isHtmlMode ? (
                      <Editor 
                        value={body} 
                        onChange={(e) => setBody(e.target.value)} 
                        containerProps={{ style: { minHeight: '150px', backgroundColor: 'white', borderRadius: '0.5rem', borderColor: '#d1d5db' } }}
                      />
                    ) : (
                      <textarea required={!isHtmlMode} rows={6} className="block w-full rounded-lg border border-gray-300 p-4 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500" value={body} onChange={(e) => setBody(e.target.value)} />
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Attachment (PDF)</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl bg-gray-50 hover:bg-gray-100">
                      <div className="space-y-1 text-center">
                        <Paperclip className="mx-auto h-8 w-8 text-gray-400" />
                        <div className="flex text-sm text-gray-600 justify-center">
                          <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 px-3 py-1 border shadow-sm">
                            <span>Choose new file</span>
                            <input type="file" accept="application/pdf" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                          </label>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {file ? <span className="font-bold text-blue-600">{file.name}</span> : activeProfile?.resume_path ? <span className="font-bold text-green-600">Using saved profile resume</span> : 'No file selected'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button type="button" onClick={() => setIsAiModalOpen(true)} className="w-full flex items-center justify-center py-2 mb-3 px-4 border border-purple-300 rounded-lg text-sm font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors">
                      <Sparkles className="w-4 h-4 mr-2" /> AI Tailor Email
                    </button>
                    <div className="flex space-x-3">
                      <button type="button" onClick={handleSaveProfile} disabled={saving} className="flex-1 flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50">
                        {saving ? <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" /> : <Save className="-ml-1 mr-2 h-5 w-5" />} Save Profile
                      </button>
                      <button type="submit" disabled={loading} className={`flex-1 flex items-center justify-center py-3 px-4 rounded-lg text-sm font-semibold text-white ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
                        {loading ? <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" /> : <Send className="-ml-1 mr-2 h-5 w-5" />} Send Email
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            ) : mode === 'sheet' ? (
              <div className="px-8 py-8 min-h-[400px]">
                {!activeProfileId ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900">No Profile Selected</h3>
                    <p className="text-gray-500 mt-2 max-w-sm mx-auto">Please select a profile from the left sidebar first.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-12 gap-4 pb-2 border-b border-gray-200 text-sm font-semibold text-gray-600">
                      <div className="col-span-1 text-center">#</div>
                      <div className="col-span-7">HR Email Address</div>
                      <div className="col-span-4">Status</div>
                    </div>
                    {rows.map((row, index) => (
                      <div key={row.id} className="grid grid-cols-12 gap-4 items-center group">
                        <div className="col-span-1 text-center text-sm font-medium text-gray-400">{index + 1}</div>
                        <div className="col-span-7">
                          <input
                            type="email" placeholder="Enter HR email..."
                            className="w-full rounded-md border-transparent bg-gray-50 hover:bg-gray-100 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 px-3 py-2 text-sm transition-all"
                            value={row.email} onChange={(e) => updateRowEmail(row.id, e.target.value)} onBlur={(e) => handleRowBlur(row.id, e.target.value)} disabled={row.status === 'sending' || row.status === 'success'}
                          />
                        </div>
                        <div className="col-span-4 flex items-center">
                          {row.status === 'idle' && <span className="text-xs text-gray-400 italic opacity-0 group-hover:opacity-100">Ready...</span>}
                          {row.status === 'sending' && <span className="flex items-center text-xs font-semibold text-blue-600"><Loader2 className="w-3 h-3 animate-spin mr-1" /> Sending...</span>}
                          {row.status === 'success' && <span className="flex items-center text-xs font-semibold text-green-600"><CheckCircle2 className="w-3 h-3 mr-1" /> Sent</span>}
                          {row.status === 'error' && <span className="flex items-center text-xs font-semibold text-red-600" title={row.message}><AlertCircle className="w-3 h-3 mr-1" /> Error</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="px-8 py-8 min-h-[400px]">
                {leadsLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-600" />
                    <p>Scraping the latest remote software jobs...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-gray-800 flex items-center"><Briefcase className="w-5 h-5 mr-2 text-blue-600"/> Latest Remote Jobs</h3>
                      <button onClick={fetchLeads} className="text-sm text-blue-600 hover:underline">Refresh List</button>
                    </div>
                    {leads.length === 0 && <p className="text-gray-500 text-center py-10">No jobs found right now.</p>}
                    
                    {leads.map((job: any) => (
                      <div key={job.id} className="border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all group bg-white">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">{job.title}</h4>
                            <p className="text-gray-600 font-medium text-sm mt-1">{job.company_name} • <span className="text-gray-500">{job.candidate_required_location}</span></p>
                          </div>
                          <a href={job.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors">
                            <ExternalLink className="w-5 h-5" />
                          </a>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {job.tags?.slice(0,4).map((tag: string) => (
                            <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{tag}</span>
                          ))}
                        </div>
                        <div className="mt-5 pt-4 border-t border-gray-100 flex justify-between items-center">
                          <span className="text-xs text-gray-400">Posted: {new Date(job.publication_date).toLocaleDateString()}</span>
                          <button 
                            onClick={() => {
                              setRecipient(`hr@${job.company_name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`);
                              setMode('single');
                            }}
                            className="text-sm font-semibold text-white bg-gray-900 hover:bg-black px-4 py-2 rounded-lg transition-colors"
                          >
                            Draft Email
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {status !== 'idle' && mode === 'single' && (
              <div className={`mx-8 mb-8 rounded-lg p-4 flex items-center ${status === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                {status === 'success' ? <CheckCircle2 className="h-5 w-5 text-green-500 mr-3" /> : <AlertCircle className="h-5 w-5 text-red-500 mr-3" />}
                <p className={`text-sm font-medium ${status === 'success' ? 'text-green-800' : 'text-red-800'}`}>{message}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Sidebar - Email Tracking logs */}
      <div className="w-72 bg-white flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center">
          <Eye className="w-5 h-5 text-blue-600 mr-2" />
          <h1 className="font-semibold text-gray-700">Email Tracking</h1>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {emailLogs.map(log => (
            <div key={log.id} className="border border-gray-100 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-gray-800 truncate" title={log.recipient}>
                  {log.recipient}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  log.status === 'Opened' ? 'bg-green-100 text-green-700' :
                  log.status === 'Sent' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {log.status}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mb-2 truncate">Sub: {log.subject}</p>
              
              <div className="flex justify-between items-center text-[10px] text-gray-400">
                <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {new Date(log.created_at).toLocaleDateString()}</span>
                {log.opened_at && <span className="text-green-600 font-medium">Read!</span>}
              </div>
            </div>
          ))}
          {emailLogs.length === 0 && (
            <div className="text-center py-10">
              <div className="bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Eye className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-600">No emails tracked yet</p>
              <p className="text-xs text-gray-400 mt-1">Send an email to see activity here.</p>
            </div>
          )}
        </div>
      </div>

    </main>
  );
}
