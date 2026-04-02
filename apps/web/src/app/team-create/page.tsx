"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function TeamCreatePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState('');
  const [logoPreview, setLogoPreview] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (status === 'loading') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 text-[var(--muted)]">
        <p className="text-[var(--muted)]">Chargement...</p>
      </main>
    );
  }

  if (!session?.user?.id) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 text-[var(--muted)]">
        <p className="text-xl font-medium">Tu dois être connecté pour créer une équipe.</p>
      </main>
    );
  }

  async function uploadLogoFile(file: File) {
    setUploadingLogo(true);
    setError(null);

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !preset) {
      setError('Upload impossible : variables d environnement Cloudinary manquantes.');
      setUploadingLogo(false);
      return null;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', preset);

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Échec upload image.');
      }

      setLogoUrl(data.secure_url);
      return data.secure_url;
    } catch (err) {
      setError(`Erreur upload du logo : ${err instanceof Error ? err.message : 'inconnue'}`);
      return null;
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!name.trim() || !tag.trim()) {
      setError('Le nom et le tag sont obligatoires.');
      return;
    }

    let finalLogoUrl = logoUrl;

    if (!finalLogoUrl && logoFile) {
      const uploadResult = await uploadLogoFile(logoFile);
      if (!uploadResult) {
        return;
      }
      finalLogoUrl = uploadResult;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/team/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          tag: tag.trim(),
          logoUrl: finalLogoUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.message || data?.error || "Erreur lors de la création de l'équipe.");
        return;
      }

      setMessage("Équipe créée avec succès !");
      setName('');
      setTag('');
      setLogoFile(null);
      setLogoUrl('');
      setLogoPreview('');

      setTimeout(() => {
        router.push('/team');
      }, 1200);
    } catch {
      setError('Impossible de contacter le serveur.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16 background-image-grid">
      <div className="glass w-full max-w-lg rounded-xl border border-[var(--border)] p-6">
        <h1 className="mb-2 text-2xl font-bold text-[var(--foreground)]">Créer une équipe</h1>
        <p className="mb-6 text-sm text-[var(--muted)]">
          Remplis les informations de ton équipe et crée un groupe compétitif.
        </p>

        <form onSubmit={handleCreateTeam} className="flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm">
            Nom de l&apos;équipe
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)] outline-none transition-colors focus:border-[var(--accent)]"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            Tag (ex: ABC)
            <input
              value={tag}
              onChange={(e) => setTag(e.target.value.toUpperCase())}
              required
              maxLength={8}
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)] outline-none transition-colors focus:border-[var(--accent)]"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            Logo de l'équipe (optionnel)
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setLogoFile(file);
                setError(null);
                if (file) {
                  setLogoPreview(URL.createObjectURL(file));
                } else {
                  setLogoPreview('');
                }
              }}
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)] outline-none transition-colors focus:border-[var(--accent)]"
            />
            {logoPreview && (
              <img
                src={logoPreview}
                alt="Prévisualisation du logo"
                className="mt-2 h-24 w-24 rounded border border-[var(--border)] object-cover"
              />
            )}
            {logoUrl && !logoPreview && (
              <img
                src={logoUrl}
                alt="Logo de l'équipe"
                className="mt-2 h-24 w-24 rounded border border-[var(--border)] object-cover"
              />
            )}
            {uploadingLogo && <p className="text-xs text-[var(--muted)]">Upload du logo en cours...</p>}
          </label>

          {error && <p className="text-sm text-red-400">{error}</p>}
          {message && <p className="text-sm text-emerald-400">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="glow cursor-pointer rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Création...' : "Créer l'équipe"}
          </button>
        </form>
      </div>
    </main>
  );
}
