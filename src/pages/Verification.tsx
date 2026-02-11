import React, { useState } from 'react';
import { Upload, Camera, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function Verification() {
  const { user } = useAuth();
  const [legalName, setLegalName] = useState('');
  const [idFile, setIdFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !idFile || !selfieFile || !legalName) {
      setErrorMsg('Please complete all fields.');
      return;
    }

    setStatus('uploading');
    setErrorMsg('');

    try {
      // 1. Upload ID
      const idExt = idFile.name.split('.').pop();
      const idPath = `${user.id}/id_document.${idExt}`;
      const { error: idError } = await supabase.storage
        .from('verification_docs')
        .upload(idPath, idFile, { upsert: true });

      if (idError) throw idError;

      // 2. Upload Selfie
      const selfieExt = selfieFile.name.split('.').pop();
      const selfiePath = `${user.id}/selfie.${selfieExt}`;
      const { error: selfieError } = await supabase.storage
        .from('verification_docs')
        .upload(selfiePath, selfieFile, { upsert: true });

      if (selfieError) throw selfieError;

      // 3. Create Request Record
      const { error: dbError } = await supabase
        .from('verification_requests')
        .insert({
          user_id: user.id,
          full_legal_name: legalName,
          id_document_url: idPath,
          selfie_with_id_url: selfiePath,
          status: 'pending'
        });

      if (dbError) throw dbError;

      setStatus('success');
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMsg(err.message || 'Upload failed. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <div className="p-6 max-w-md mx-auto text-center space-y-6 mt-10">
        <div className="flex justify-center">
          <CheckCircle className="w-20 h-20 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-white">Verification Submitted</h2>
        <p className="text-zinc-400">
          Our team is reviewing your documents. You will receive a notification once your Creator status is approved (usually within 24 hours).
        </p>
        <button 
          onClick={() => window.location.href = '/profile/' + user?.id}
          className="w-full py-3 bg-zinc-800 rounded-xl font-bold hover:bg-zinc-700 transition"
        >
          Back to Profile
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto pb-24">
      <header className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/20 mb-4">
          <ShieldCheck className="w-8 h-8 text-purple-400" />
        </div>
        <h1 className="text-2xl font-bold text-white">Become a Creator</h1>
        <p className="text-zinc-400 mt-2 text-sm">
          To monetize content and go live, we need to verify your identity. This data is encrypted and stored securely.
        </p>
      </header>

      <form onSubmit={handleUpload} className="space-y-6">
        {/* Legal Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Full Legal Name</label>
          <input
            type="text"
            value={legalName}
            onChange={(e) => setLegalName(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none"
            placeholder="As it appears on your ID"
          />
        </div>

        {/* ID Upload */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Government ID (Front)</label>
          <div className="relative border-2 border-dashed border-zinc-700 rounded-xl p-6 text-center hover:bg-zinc-900/50 transition group">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setIdFile(e.target.files?.[0] || null)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Upload className="w-8 h-8 text-zinc-500 mx-auto mb-2 group-hover:text-purple-400" />
            <p className="text-sm text-zinc-400">
              {idFile ? <span className="text-purple-400">{idFile.name}</span> : "Tap to upload photo"}
            </p>
          </div>
        </div>

        {/* Selfie Upload */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Selfie holding ID</label>
          <div className="relative border-2 border-dashed border-zinc-700 rounded-xl p-6 text-center hover:bg-zinc-900/50 transition group">
            <input
              type="file"
              accept="image/*,capture=camera"
              onChange={(e) => setSelfieFile(e.target.files?.[0] || null)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Camera className="w-8 h-8 text-zinc-500 mx-auto mb-2 group-hover:text-purple-400" />
            <p className="text-sm text-zinc-400">
              {selfieFile ? <span className="text-purple-400">{selfieFile.name}</span> : "Take a selfie"}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 text-red-400 p-3 rounded-lg flex items-center gap-2 text-sm">
            <AlertTriangle className="w-4 h-4" />
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={status === 'uploading'}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'uploading' ? 'Encrypting & Uploading...' : 'Submit for Verification'}
        </button>
      </form>
    </div>
  );
}
