'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Mail, Zap, Shield, FileText, ArrowRight, CheckCircle2, Code } from 'lucide-react';

export default function LandingPage() {
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-blue-100">
      {/* Navigation */}
      <nav className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">MailMate</span>
            </div>
            <div className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium">How it Works</a>
            </div>
            <div>
              <Link 
                href="/tool" 
                className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-full text-white bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow-md transition-all active:scale-95"
              >
                Launch App
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 sm:pt-40 sm:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grid.framerusercontent.com/assets/framer-grid.svg')] opacity-[0.03] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 font-semibold text-sm mb-6 border border-blue-100">
              <Zap className="w-4 h-4 mr-2" />
              100% Free to use
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-8">
              Send <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Perfect Emails</span> <br className="hidden md:block" />
              in One Click.
            </h1>
            <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              Automate your job applications, client outreach, or routine emails. Save multiple profiles, attach your resumes instantly, and never copy-paste again.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link 
                href="/tool"
                className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-semibold rounded-full text-white bg-gray-900 hover:bg-gray-800 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 w-full sm:w-auto group"
              >
                Start Automating Now
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Everything you need to scale your outreach</h2>
            <p className="mt-4 text-lg text-gray-600">Built for speed, flexibility, and absolute privacy.</p>
          </div>

          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {/* Feature 1 */}
            <motion.div variants={fadeIn} className="p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:border-blue-100 transition-colors">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Saved Profiles</h3>
              <p className="text-gray-600 leading-relaxed">
                Create "Fresher", "Experienced", or any other profile. Instantly load your tailored subject, body, and resume with a single click.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div variants={fadeIn} className="p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:border-blue-100 transition-colors">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
                <Code className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Rich HTML Mode</h3>
              <p className="text-gray-600 leading-relaxed">
                Send plain text for simplicity, or toggle HTML mode to embed links, format text with bolding, and completely design your email exactly how you want.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div variants={fadeIn} className="p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:border-blue-100 transition-colors">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">100% Private</h3>
              <p className="text-gray-600 leading-relaxed">
                Bring your own Gmail account. Your App Password is encrypted and stored locally in your browser. We never read or store your emails.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* How it works */}
      <div id="how-it-works" className="py-24 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold">How it works</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-blue-400">1</div>
              <h4 className="text-xl font-semibold mb-2">Connect Gmail</h4>
              <p className="text-gray-400">Add your Gmail App Password securely in our private settings panel.</p>
            </div>
            <div className="p-6">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-blue-400">2</div>
              <h4 className="text-xl font-semibold mb-2">Create Profiles</h4>
              <p className="text-gray-400">Write your templates and upload your resumes for different scenarios.</p>
            </div>
            <div className="p-6">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-blue-400">3</div>
              <h4 className="text-xl font-semibold mb-2">Send in 1-Click</h4>
              <p className="text-gray-400">Select a profile, enter the recipient email, and hit send. It's that fast.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-gradient-to-br from-blue-600 to-indigo-700 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to speed up your workflow?</h2>
          <p className="text-xl text-blue-100 mb-10">No credit card required. Free forever.</p>
          <Link 
            href="/tool"
            className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-bold rounded-full text-blue-600 bg-white hover:bg-gray-50 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1"
          >
            Go to App
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12 text-center text-gray-500">
        <div className="flex justify-center items-center space-x-2 mb-4">
          <Mail className="w-5 h-5 text-blue-600" />
          <span className="font-bold text-gray-900">MailMate</span>
        </div>
        <p>© {new Date().getFullYear()} MailMate Automation. All rights reserved.</p>
      </footer>
    </div>
  );
}
