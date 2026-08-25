'use client';

import { useState, useEffect } from 'react';
import { Mail, User, FileText, Paperclip, Send, CheckCircle2, AlertCircle, Loader2, Plus, Save, Sidebar, Code, Settings, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Profile {
  id: string;
  name: string;
  subject: string;
  body: string;
  resume_path: string | null;
}

export default function Home() {
  // Form State
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  
  // App State
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [smtpEmail, setSmtpEmail] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');

  // Initial load
  useEffect(() => {
    fetchProfiles();
    
    // Load settings from local storage
    const storedEmail = localStorage.getItem('smtpEmail');
    const storedPass = localStorage.getItem('smtpPassword');
    if (storedEmail) setSmtpEmail(storedEmail);
    if (storedPass) setSmtpPassword(storedPass);
  }, []);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('name');
      if (data) {
        setProfiles(data);
      }
    } catch (e) {
      console.warn("Supabase not properly initialized");
    }
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

  const handleSaveProfile = async () => {
    const profileName = prompt("Enter a name for this profile (e.g. Fresher, Experienced):");
    if (!profileName) return;

    setSaving(true);
    setStatus('idle');
    try {
      let resume_path = null;

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(filePath, file);

        if (uploadError) throw uploadError;
        resume_path = filePath;
      } else if (activeProfileId) {
        const existingProfile = profiles.find(p => p.id === activeProfileId);
        resume_path = existingProfile?.resume_path || null;
      }

      const profileData = {
        name: profileName,
        subject,
        body,
        resume_path,
      };

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
      console.error(error);
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

  const handleSubmit = async (e: React.FormEvent) => {
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

    const formData = new FormData();
    formData.append('recipient', recipient);
    formData.append('subject', subject);
    formData.append('body', body);
    formData.append('isHtml', String(isHtmlMode));
    
    if (smtpEmail) formData.append('smtpEmail', smtpEmail);
    if (smtpPassword) formData.append('smtpPassword', smtpPassword);
    
    if (file) {
      formData.append('file', file);
    } else if (activeProfileId) {
      const existingProfile = profiles.find(p => p.id === activeProfileId);
      if (existingProfile?.resume_path) {
        formData.append('resumePath', existingProfile.resume_path);
      }
    }

    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setMessage('Email sent successfully!');
        setRecipient('');
      } else {
        setStatus('error');
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setStatus('error');
      setMessage('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const activeProfile = profiles.find(p => p.id === activeProfileId);

  return (
    <main className="min-h-screen bg-gray-50 flex font-sans relative">
      
      {/* Settings Modal overlay */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-gray-800 text-lg flex items-center">
                <Settings className="w-5 h-5 mr-2 text-gray-600" />
                SMTP Settings
              </h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Configure your own Gmail account to send emails from. These details are saved securely in your browser and are not shared.
              </p>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Your Gmail Address</label>
                <input
                  type="email"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="you@gmail.com"
                  value={smtpEmail}
                  onChange={(e) => setSmtpEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Gmail App Password</label>
                <input
                  type="password"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="16-character app password"
                  value={smtpPassword}
                  onChange={(e) => setSmtpPassword(e.target.value)}
                />
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3">
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveSettings}
                className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center">
          <Sidebar className="w-5 h-5 text-gray-500 mr-2" />
          <h1 className="font-semibold text-gray-700">Profiles</h1>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {profiles.map(profile => (
            <button
              key={profile.id}
              onClick={() => handleSelectProfile(profile)}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeProfileId === profile.id
                  ? 'bg-blue-50 text-blue-700 border border-blue-100'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {profile.name}
            </button>
          ))}
          {profiles.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-4">No profiles saved yet.</p>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 space-y-3">
          <button
            onClick={handleCreateNew}
            className="w-full flex items-center justify-center px-4 py-2 border border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Profile
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-8 text-white text-center relative">
            <h2 className="text-2xl font-bold tracking-tight">
              {activeProfile ? `Editing: ${activeProfile.name}` : 'Send Application'}
            </h2>
            <p className="mt-1 text-blue-100 text-sm max-w-sm mx-auto">
              {activeProfile ? 'Your data is loaded and ready to send.' : 'Create a new email or select a profile.'}
            </p>
          </div>

          {/* Form Section */}
          <div className="px-8 py-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Recipient */}
                <div className="space-y-2 relative">
                  <label htmlFor="recipient" className="block text-sm font-semibold text-gray-700">
                    Recipient Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="recipient"
                      type="email"
                      required
                      className="pl-10 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors sm:text-sm"
                      placeholder="hr@company.com"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                    />
                  </div>
                </div>

                {/* Subject */}
                <div className="space-y-2 relative">
                  <label htmlFor="subject" className="block text-sm font-semibold text-gray-700">
                    Subject Line
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FileText className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="subject"
                      type="text"
                      required
                      className="pl-10 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors sm:text-sm"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Email Body */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="body" className="block text-sm font-semibold text-gray-700">
                    Message Body
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsHtmlMode(!isHtmlMode)}
                    className={`flex items-center text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                      isHtmlMode 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Code className="w-3.5 h-3.5 mr-1" />
                    {isHtmlMode ? 'HTML Mode: ON' : 'HTML Mode: OFF'}
                  </button>
                </div>
                <textarea
                  id="body"
                  required
                  rows={6}
                  className={`block w-full rounded-lg border border-gray-300 p-4 text-gray-900 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors sm:text-sm ${
                    isHtmlMode ? 'font-mono' : ''
                  }`}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={isHtmlMode ? '<p>Hello,</p><br/><p>My resume is attached.</p>' : 'Hello,\n\nMy resume is attached.'}
                />
              </div>

              {/* File Attachment */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Attachment (PDF)
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors relative">
                  <div className="space-y-1 text-center">
                    <Paperclip className="mx-auto h-8 w-8 text-gray-400" />
                    <div className="flex text-sm text-gray-600 justify-center">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 px-3 py-1 border shadow-sm"
                      >
                        <span>Choose new file</span>
                        <input 
                          id="file-upload" 
                          name="file-upload" 
                          type="file" 
                          accept="application/pdf"
                          className="sr-only" 
                          onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {file ? (
                        <span className="font-semibold text-blue-600">{file.name}</span>
                      ) : activeProfile?.resume_path ? (
                        <span className="font-semibold text-green-600">Using saved profile resume</span>
                      ) : (
                        'No file selected'
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex space-x-3">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-all"
                >
                  {saving ? <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" /> : <Save className="-ml-1 mr-2 h-5 w-5" />}
                  Save Profile
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white transition-all ${
                    loading 
                      ? 'bg-blue-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md'
                  }`}
                >
                  {loading ? <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" /> : <Send className="-ml-1 mr-2 h-5 w-5" />}
                  Send Email
                </button>
              </div>

              {/* Status Message */}
              {status !== 'idle' && (
                <div className={`rounded-lg p-4 flex items-center ${
                  status === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  {status === 'success' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-3" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                  )}
                  <p className={`text-sm font-medium ${
                    status === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {message}
                  </p>
                </div>
              )}

            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
