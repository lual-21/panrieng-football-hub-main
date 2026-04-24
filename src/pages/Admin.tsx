import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, Trophy, Calendar, Newspaper, Plus, Edit2, Trash2, 
  LogOut, Loader2, Shield, AlertTriangle, Upload, CheckCircle2, Image, Medal, UserCog, GitBranch
} from 'lucide-react';
import { KnockoutManager } from '@/components/admin/KnockoutManager';
import { cn } from '@/lib/utils';
import { ResultCard } from '@/components/admin/ResultCard';

type Tab = 'leagues' | 'teams' | 'players' | 'matches' | 'results' | 'news' | 'users' | 'knockout';
type DbTable = 'leagues' | 'teams' | 'players' | 'matches' | 'news';

interface AppUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  roles: string[];
}

interface Team {
  id: string;
  name: string;
  short_name: string;
  logo_url: string | null;
  founded: number | null;
  stadium: string | null;
  manager: string | null;
  description: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  league_id: string | null;
}

interface Player {
  id: string;
  name: string;
  position: string;
  number: number;
  age: number | null;
  nationality: string | null;
  team_id: string | null;
  photo_url: string | null;
  appearances: number;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
  rating: number;
}

interface Match {
  id: string;
  home_team_id: string;
  away_team_id: string;
  match_date: string;
  match_time: string;
  venue: string;
  home_score: number | null;
  away_score: number | null;
  is_completed: boolean;
  motm_player_id: string | null;
  league_id: string | null;
}

interface NewsArticle {
  id: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  category: string;
  author: string | null;
  image_url: string | null;
}

interface League {
  id: string;
  name: string;
  short_name: string;
  season: string;
  logo_url: string | null;
  description: string | null;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  format: string;
}

const Admin = () => {
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<Tab>('leagues');
  const [leagues, setLeagues] = useState<League[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [appUsers, setAppUsers] = useState<AppUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  
  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Get pending matches (not completed)
  const pendingMatches = matches.filter(m => !m.is_completed);

  // Fetch users function
  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke('list-users', {
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token}`
        }
      });
      
      if (response.error) throw response.error;
      if (response.data?.users) {
        setAppUsers(response.data.users);
      }
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      toast({ title: 'Error', description: 'Failed to fetch users', variant: 'destructive' });
    } finally {
      setUsersLoading(false);
    }
  };

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

  // Fetch data
  useEffect(() => {
    if (user && isAdmin) {
      fetchAllData();
    }
  }, [user, isAdmin]);

  // Load users when switching to Users tab
  useEffect(() => {
    if (activeTab === 'users' && isAdmin) {
      fetchUsers();
    }
  }, [activeTab, isAdmin]);

  const fetchAllData = async () => {
    setDataLoading(true);
    const [leaguesRes, teamsRes, playersRes, matchesRes, newsRes] = await Promise.all([
      supabase.from('leagues').select('*').order('created_at', { ascending: false }),
      supabase.from('teams').select('*').order('name'),
      supabase.from('players').select('*').order('name'),
      supabase.from('matches').select('*').order('match_date', { ascending: false }),
      supabase.from('news').select('*').order('published_at', { ascending: false })
    ]);
    
    if (leaguesRes.data) setLeagues(leaguesRes.data);
    if (teamsRes.data) setTeams(teamsRes.data);
    if (playersRes.data) setPlayers(playersRes.data);
    if (matchesRes.data) setMatches(matchesRes.data);
    if (newsRes.data) setNews(newsRes.data);
    setDataLoading(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const openForm = (item?: any) => {
    if (item) {
      setEditingId(item.id);
      setFormData(item);
    } else {
      setEditingId(null);
      setFormData(getDefaultFormData());
    }
    setShowForm(true);
  };

  const getDefaultFormData = () => {
    switch (activeTab) {
      case 'leagues':
        return { name: '', short_name: '', season: '', description: '', is_active: true, start_date: '', end_date: '', format: 'league' };
      case 'teams':
        return { name: '', short_name: '', founded: '', stadium: '', manager: '', description: '' };
      case 'players':
        return { name: '', position: 'Forward', number: '', age: '', nationality: 'South Sudan', team_id: '' };
      case 'matches':
        return { home_team_id: '', away_team_id: '', match_date: '', match_time: '15:00', venue: '', is_completed: false };
      case 'news':
        return { title: '', excerpt: '', content: '', category: 'Announcement' };
      default:
        return {};
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'results') return;
    
    setSubmitting(true);

    try {
      const table = activeTab as DbTable;
      let payload = { ...formData };
      
      // Clean up payload
      delete payload.id;
      delete payload.created_at;
      delete payload.updated_at;

      if (editingId) {
        const { error } = await supabase.from(table).update(payload).eq('id', editingId);
        if (error) throw error;
        toast({ title: 'Updated!', description: `${activeTab.slice(0, -1)} updated successfully.` });
      } else {
        const { error } = await supabase.from(table).insert(payload);
        if (error) throw error;
        toast({ title: 'Created!', description: `${activeTab.slice(0, -1)} created successfully.` });
      }

      setShowForm(false);
      fetchAllData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (activeTab === 'results') return;
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const table = activeTab as DbTable;
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Deleted!', description: 'Item deleted successfully.' });
      fetchAllData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-16 h-16 mx-auto rounded-full bg-destructive/20 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-xl font-display text-foreground mb-2">Access Denied</h1>
          <p className="text-sm text-muted-foreground mb-4">
            You don't have admin privileges. Contact the association to request access.
          </p>
          <Button onClick={() => navigate('/')} variant="outline">
            Return to App
          </Button>
        </motion.div>
      </div>
    );
  }

  const knockoutLeaguesCount = leagues.filter(l => l.format === 'knockout').length;
  
  const tabs = [
    { id: 'leagues' as Tab, label: 'Leagues', icon: Medal, count: leagues.length },
    { id: 'teams' as Tab, label: 'Teams', icon: Users, count: teams.length },
    { id: 'players' as Tab, label: 'Players', icon: Trophy, count: players.length },
    { id: 'matches' as Tab, label: 'Fixtures', icon: Calendar, count: matches.length },
    { id: 'results' as Tab, label: 'Results', icon: CheckCircle2, count: pendingMatches.length },
    { id: 'knockout' as Tab, label: 'Knockout', icon: GitBranch, count: knockoutLeaguesCount },
    { id: 'news' as Tab, label: 'News', icon: Newspaper, count: news.length },
    { id: 'users' as Tab, label: 'Users', icon: UserCog, count: appUsers.length },
  ];

  // Toggle admin role for a user
  const toggleAdminRole = async (userId: string, hasAdmin: boolean) => {
    try {
      if (hasAdmin) {
        // Remove admin role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');
        if (error) throw error;
        toast({ title: 'Role removed', description: 'Admin role removed from user.' });
      } else {
        // Add admin role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'admin' });
        if (error) throw error;
        toast({ title: 'Role added', description: 'Admin role granted to user.' });
      }
      fetchUsers();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  // Render users list
  const renderUsersList = () => {
    if (usersLoading) {
      return (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      );
    }

    if (appUsers.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <p>No users found.</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {appUsers.map((appUser) => {
          const isUserAdmin = appUser.roles.includes('admin');
          const isCurrentUser = appUser.id === user?.id;
          
          return (
            <motion.div
              key={appUser.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-between bg-gradient-card rounded-lg border border-border/50 p-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground truncate">
                    {appUser.email}
                  </p>
                  {isUserAdmin && (
                    <span className="px-2 py-0.5 text-[10px] font-medium bg-primary/20 text-primary rounded-full">
                      Admin
                    </span>
                  )}
                  {isCurrentUser && (
                    <span className="px-2 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground rounded-full">
                      You
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Joined: {new Date(appUser.created_at).toLocaleDateString()}
                  {appUser.last_sign_in_at && ` • Last login: ${new Date(appUser.last_sign_in_at).toLocaleDateString()}`}
                </p>
              </div>
              <Button
                size="sm"
                variant={isUserAdmin ? "destructive" : "default"}
                onClick={() => toggleAdminRole(appUser.id, isUserAdmin)}
                disabled={isCurrentUser}
                className="ml-2"
              >
                {isUserAdmin ? 'Remove Admin' : 'Make Admin'}
              </Button>
            </motion.div>
          );
        })}
      </div>
    );
  };

  // Upload image to storage
  const uploadImage = async (file: File, bucket: string, folder: string) => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
      return data.publicUrl;
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string, bucket: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await uploadImage(file, bucket, field);
    if (url) {
      setFormData({ ...formData, [field]: url });
      toast({ title: 'Image uploaded!', description: 'Image uploaded successfully.' });
    }
  };

  // Quick result update
  interface MatchEvent {
    player_id: string;
    event_type: 'goal' | 'assist' | 'yellow_card' | 'red_card';
    minute?: number;
  }

  const updateMatchResult = async (matchId: string, homeScore: number, awayScore: number, motmId: string | null, events: MatchEvent[] = [], lineup: string[] = []) => {
    try {
      // Update match result
      const { error: matchError } = await supabase
        .from('matches')
        .update({
          home_score: homeScore,
          away_score: awayScore,
          motm_player_id: motmId,
          is_completed: true
        })
        .eq('id', matchId);

      if (matchError) throw matchError;

      // Insert match events if any
      if (events.length > 0) {
        const eventsToInsert = events.map(e => ({
          match_id: matchId,
          player_id: e.player_id,
          event_type: e.event_type,
          minute: e.minute || null
        }));

        const { error: eventsError } = await supabase
          .from('match_events')
          .insert(eventsToInsert);

        if (eventsError) throw eventsError;
      }

      // Insert lineup (player appearances) if any
      if (lineup.length > 0) {
        const lineupsToInsert = lineup.map(playerId => ({
          match_id: matchId,
          player_id: playerId
        }));

        const { error: lineupError } = await supabase
          .from('match_lineups')
          .insert(lineupsToInsert);

        if (lineupError) throw lineupError;
      }

      toast({ title: 'Result saved!', description: 'Match result, stats, and appearances updated.' });
      fetchAllData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const renderList = () => {
    if (activeTab === 'results') {
      return renderResultsList();
    }
    
    if (activeTab === 'users') {
      return renderUsersList();
    }
    
    if (activeTab === 'knockout') {
      return <KnockoutManager leagues={leagues} teams={teams} />;
    }

    const items = activeTab === 'leagues' ? leagues
      : activeTab === 'teams' ? teams 
      : activeTab === 'players' ? players 
      : activeTab === 'matches' ? matches 
      : news;

    if (items.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <p>No {activeTab} found. Create your first one!</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {items.map((item: any) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between bg-gradient-card rounded-lg border border-border/50 p-3"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {activeTab === 'matches' 
                  ? `${teams.find(t => t.id === item.home_team_id)?.short_name || '?'} vs ${teams.find(t => t.id === item.away_team_id)?.short_name || '?'}`
                  : item.name || item.title}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {activeTab === 'leagues' && `${item.season} • ${item.format === 'knockout' ? 'Knockout' : 'League'} ${item.is_active ? '• Active' : '• Inactive'}`}
                {activeTab === 'teams' && item.short_name}
                {activeTab === 'players' && `${item.position} • #${item.number}`}
                {activeTab === 'matches' && `${item.match_date} • ${item.venue}`}
                {activeTab === 'news' && item.category}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="icon" variant="ghost" onClick={() => openForm(item)}>
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => handleDelete(item.id)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  const renderForm = () => {
    switch (activeTab) {
      case 'leagues':
        return (
          <>
            {/* League Logo Upload */}
            <div>
              <Label>League Logo</Label>
              <div className="flex items-center gap-3 mt-1">
                {formData.logo_url ? (
                  <img src={formData.logo_url} alt="Logo" className="w-16 h-16 object-contain rounded-lg border border-border" />
                ) : (
                  <div className="w-16 h-16 rounded-lg border border-dashed border-border flex items-center justify-center bg-muted/30">
                    <Image className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <label className="flex-1">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background cursor-pointer hover:bg-muted/50 transition-colors">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    <span className="text-sm">{uploading ? 'Uploading...' : 'Upload Logo'}</span>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'logo_url', 'team-logos')} disabled={uploading} />
                </label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>League Name *</Label>
                <Input value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div>
                <Label>Short Name *</Label>
                <Input value={formData.short_name || ''} onChange={e => setFormData({ ...formData, short_name: e.target.value })} required maxLength={10} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Season *</Label>
                <Input value={formData.season || ''} onChange={e => setFormData({ ...formData, season: e.target.value })} placeholder="e.g. 2024/25" required />
              </div>
              <div>
                <Label>Format *</Label>
                <Select value={formData.format || 'league'} onValueChange={v => setFormData({ ...formData, format: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="league">Points-Based League</SelectItem>
                    <SelectItem value="knockout">Knockout Tournament</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={formData.start_date || ''} onChange={e => setFormData({ ...formData, start_date: e.target.value || null })} />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="date" value={formData.end_date || ''} onChange={e => setFormData({ ...formData, end_date: e.target.value || null })} />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active ?? true}
                onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="is_active">Active League</Label>
            </div>
          </>
        );

      case 'teams':
        return (
          <>
            {/* Logo Upload */}
            <div>
              <Label>Team Logo</Label>
              <div className="flex items-center gap-3 mt-1">
                {formData.logo_url ? (
                  <img src={formData.logo_url} alt="Logo" className="w-16 h-16 object-contain rounded-lg border border-border" />
                ) : (
                  <div className="w-16 h-16 rounded-lg border border-dashed border-border flex items-center justify-center bg-muted/30">
                    <Image className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <label className="flex-1">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background cursor-pointer hover:bg-muted/50 transition-colors">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    <span className="text-sm">{uploading ? 'Uploading...' : 'Upload Logo'}</span>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'logo_url', 'team-logos')} disabled={uploading} />
                </label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Team Name *</Label>
                <Input value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div>
                <Label>Short Name *</Label>
                <Input value={formData.short_name || ''} onChange={e => setFormData({ ...formData, short_name: e.target.value })} required maxLength={3} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Founded Year</Label>
                <Input type="number" value={formData.founded || ''} onChange={e => setFormData({ ...formData, founded: parseInt(e.target.value) || null })} />
              </div>
              <div>
                <Label>Manager</Label>
                <Input value={formData.manager || ''} onChange={e => setFormData({ ...formData, manager: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Stadium</Label>
              <Input value={formData.stadium || ''} onChange={e => setFormData({ ...formData, stadium: e.target.value })} />
            </div>
            <div>
              <Label>League</Label>
              <Select value={formData.league_id || ''} onValueChange={v => setFormData({ ...formData, league_id: v || null })}>
                <SelectTrigger><SelectValue placeholder="Select league" /></SelectTrigger>
                <SelectContent>
                  {leagues.map(league => (
                    <SelectItem key={league.id} value={league.id}>{league.name} ({league.season})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} />
            </div>
          </>
        );

      case 'players':
        return (
          <>
            {/* Photo Upload */}
            <div>
              <Label>Player Photo</Label>
              <div className="flex items-center gap-3 mt-1">
                {formData.photo_url ? (
                  <img src={formData.photo_url} alt="Photo" className="w-16 h-16 object-cover rounded-full border border-border" />
                ) : (
                  <div className="w-16 h-16 rounded-full border border-dashed border-border flex items-center justify-center bg-muted/30">
                    <Image className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <label className="flex-1">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background cursor-pointer hover:bg-muted/50 transition-colors">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    <span className="text-sm">{uploading ? 'Uploading...' : 'Upload Photo'}</span>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'photo_url', 'player-photos')} disabled={uploading} />
                </label>
              </div>
            </div>
            <div>
              <Label>Player Name *</Label>
              <Input value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Position *</Label>
                <Select value={formData.position || 'Forward'} onValueChange={v => setFormData({ ...formData, position: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Goalkeeper">Goalkeeper</SelectItem>
                    <SelectItem value="Defender">Defender</SelectItem>
                    <SelectItem value="Midfielder">Midfielder</SelectItem>
                    <SelectItem value="Forward">Forward</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Number *</Label>
                <Input type="number" value={formData.number || ''} onChange={e => setFormData({ ...formData, number: parseInt(e.target.value) })} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Age</Label>
                <Input type="number" value={formData.age || ''} onChange={e => setFormData({ ...formData, age: parseInt(e.target.value) || null })} />
              </div>
              <div>
                <Label>Team</Label>
                <Select value={formData.team_id || ''} onValueChange={v => setFormData({ ...formData, team_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger>
                  <SelectContent>
                    {teams.map(team => (
                      <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        );

      case 'matches':
        return (
          <>
            <div>
              <Label>League</Label>
              <Select value={formData.league_id || ''} onValueChange={v => setFormData({ ...formData, league_id: v || null })}>
                <SelectTrigger><SelectValue placeholder="Select league" /></SelectTrigger>
                <SelectContent>
                  {leagues.map(league => (
                    <SelectItem key={league.id} value={league.id}>{league.name} ({league.season})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Home Team *</Label>
                <Select value={formData.home_team_id || ''} onValueChange={v => setFormData({ ...formData, home_team_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger>
                  <SelectContent>
                    {teams.map(team => (
                      <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Away Team *</Label>
                <Select value={formData.away_team_id || ''} onValueChange={v => setFormData({ ...formData, away_team_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger>
                  <SelectContent>
                    {teams.map(team => (
                      <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date *</Label>
                <Input type="date" value={formData.match_date || ''} onChange={e => setFormData({ ...formData, match_date: e.target.value })} required />
              </div>
              <div>
                <Label>Time *</Label>
                <Input type="time" value={formData.match_time || ''} onChange={e => setFormData({ ...formData, match_time: e.target.value })} required />
              </div>
            </div>
            <div>
              <Label>Venue *</Label>
              <Input value={formData.venue || ''} onChange={e => setFormData({ ...formData, venue: e.target.value })} required />
            </div>
            {editingId && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Home Score</Label>
                    <Input type="number" value={formData.home_score ?? ''} onChange={e => setFormData({ ...formData, home_score: e.target.value ? parseInt(e.target.value) : null })} />
                  </div>
                  <div>
                    <Label>Away Score</Label>
                    <Input type="number" value={formData.away_score ?? ''} onChange={e => setFormData({ ...formData, away_score: e.target.value ? parseInt(e.target.value) : null })} />
                  </div>
                </div>
                <div>
                  <Label>Man of the Match</Label>
                  <Select value={formData.motm_player_id || ''} onValueChange={v => setFormData({ ...formData, motm_player_id: v || null })}>
                    <SelectTrigger><SelectValue placeholder="Select player" /></SelectTrigger>
                    <SelectContent>
                      {players.map(player => (
                        <SelectItem key={player.id} value={player.id}>{player.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_completed"
                    checked={formData.is_completed || false}
                    onChange={e => setFormData({ ...formData, is_completed: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="is_completed">Match Completed</Label>
                </div>
              </>
            )}
          </>
        );

      case 'news':
        return (
          <>
            <div>
              <Label>Cover Image</Label>
              <div className="flex items-center gap-3 mt-1">
                {formData.image_url ? (
                  <div className="w-24 h-16 rounded-lg overflow-hidden bg-muted">
                    <img src={formData.image_url} alt="Cover" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-24 h-16 rounded-lg bg-muted flex items-center justify-center">
                    <Image className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <label className="flex-1">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background cursor-pointer hover:bg-muted/50 transition-colors">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    <span className="text-sm">{uploading ? 'Uploading...' : 'Upload Image'}</span>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'image_url', 'news-images')} disabled={uploading} />
                </label>
              </div>
            </div>
            <div>
              <Label>Title *</Label>
              <Input value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
            </div>
            <div>
              <Label>Category *</Label>
              <Select value={formData.category || 'Announcement'} onValueChange={v => setFormData({ ...formData, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Match Report">Match Report</SelectItem>
                  <SelectItem value="Transfer News">Transfer News</SelectItem>
                  <SelectItem value="Announcement">Announcement</SelectItem>
                  <SelectItem value="Feature">Feature</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Excerpt</Label>
              <Input value={formData.excerpt || ''} onChange={e => setFormData({ ...formData, excerpt: e.target.value })} />
            </div>
            <div>
              <Label>Content</Label>
              <Textarea value={formData.content || ''} onChange={e => setFormData({ ...formData, content: e.target.value })} rows={5} />
            </div>
          </>
        );
    }
  };

  // Results list component
  const renderResultsList = () => {
    if (pendingMatches.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>All matches have results!</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {pendingMatches.map((match) => {
          const homeTeam = teams.find(t => t.id === match.home_team_id);
          const awayTeam = teams.find(t => t.id === match.away_team_id);
          const matchPlayers = players.filter(p => p.team_id === match.home_team_id || p.team_id === match.away_team_id);
          
          return (
            <ResultCard
              key={match.id}
              match={match}
              homeTeam={homeTeam}
              awayTeam={awayTeam}
              matchPlayers={matchPlayers}
              onSave={updateMatchResult}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-4">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="container py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-display tracking-wide text-foreground">Admin Dashboard</h1>
                <p className="text-[10px] text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-4">
        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setShowForm(false); }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                <span className="text-[10px] opacity-70">({tab.count})</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {showForm ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-gradient-card rounded-xl border border-border/50 p-4"
            >
              <h2 className="text-lg font-display mb-4">
                {editingId ? `Edit ${activeTab.slice(0, -1)}` : `Add ${activeTab.slice(0, -1)}`}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-3">
                {renderForm()}
                <div className="flex gap-2 pt-2">
                  <Button type="submit" disabled={submitting} className="flex-1">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingId ? 'Update' : 'Create')}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {activeTab === 'results' ? 'Pending Results' : activeTab === 'users' ? 'User Management' : activeTab === 'knockout' ? 'Knockout Brackets' : activeTab}
                </h2>
                {activeTab !== 'results' && activeTab !== 'users' && activeTab !== 'knockout' && (
                  <Button size="sm" onClick={() => openForm()}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                )}
              </div>
              {dataLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                renderList()
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Admin;
