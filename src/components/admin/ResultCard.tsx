import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Save, Plus, X, Goal, Handshake, Square, Users } from 'lucide-react';

interface Team {
  id: string;
  name: string;
  short_name: string;
  logo_url: string | null;
}

interface Player {
  id: string;
  name: string;
  team_id: string | null;
}

interface Match {
  id: string;
  home_team_id: string;
  away_team_id: string;
  match_date: string;
  match_time: string;
  venue: string;
}

interface MatchEvent {
  player_id: string;
  event_type: 'goal' | 'assist' | 'yellow_card' | 'red_card';
  minute?: number;
}

interface ResultCardProps {
  match: Match;
  homeTeam: Team | undefined;
  awayTeam: Team | undefined;
  matchPlayers: Player[];
  onSave: (matchId: string, homeScore: number, awayScore: number, motmId: string | null, events: MatchEvent[], lineup: string[]) => Promise<void>;
}

export const ResultCard = ({ match, homeTeam, awayTeam, matchPlayers, onSave }: ResultCardProps) => {
  const [homeScore, setHomeScore] = useState<string>('');
  const [awayScore, setAwayScore] = useState<string>('');
  const [motmId, setMotmId] = useState<string>('');
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [lineup, setLineup] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [showEvents, setShowEvents] = useState(false);
  const [showLineup, setShowLineup] = useState(false);

  const homePlayers = matchPlayers.filter(p => p.team_id === match.home_team_id);
  const awayPlayers = matchPlayers.filter(p => p.team_id === match.away_team_id);

  const togglePlayer = (playerId: string) => {
    setLineup(prev => 
      prev.includes(playerId) 
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const selectAllTeam = (teamId: string) => {
    const teamPlayerIds = matchPlayers.filter(p => p.team_id === teamId).map(p => p.id);
    const allSelected = teamPlayerIds.every(id => lineup.includes(id));
    if (allSelected) {
      setLineup(prev => prev.filter(id => !teamPlayerIds.includes(id)));
    } else {
      setLineup(prev => [...new Set([...prev, ...teamPlayerIds])]);
    }
  };

  const addEvent = (type: MatchEvent['event_type']) => {
    setEvents([...events, { player_id: '', event_type: type }]);
  };

  const updateEvent = (index: number, field: keyof MatchEvent, value: string | number) => {
    const updated = [...events];
    updated[index] = { ...updated[index], [field]: value };
    setEvents(updated);
  };

  const removeEvent = (index: number) => {
    setEvents(events.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (homeScore === '' || awayScore === '') return;
    setSaving(true);
    
    const validEvents = events.filter(e => e.player_id);
    
    await onSave(match.id, parseInt(homeScore), parseInt(awayScore), motmId || null, validEvents, lineup);
    setSaving(false);
    setHomeScore('');
    setAwayScore('');
    setMotmId('');
    setEvents([]);
    setLineup([]);
    setShowEvents(false);
    setShowLineup(false);
  };

  const getEventIcon = (type: MatchEvent['event_type']) => {
    switch (type) {
      case 'goal': return <Goal className="w-4 h-4 text-primary" />;
      case 'assist': return <Handshake className="w-4 h-4 text-blue-500" />;
      case 'yellow_card': return <Square className="w-4 h-4 text-yellow-500 fill-yellow-500" />;
      case 'red_card': return <Square className="w-4 h-4 text-red-500 fill-red-500" />;
    }
  };

  return (
    <div className="bg-gradient-card rounded-xl border border-border/50 p-4">
      {/* Match Info */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs text-muted-foreground">
          {match.match_date} • {match.match_time}
        </div>
        <div className="text-xs text-muted-foreground">
          {match.venue}
        </div>
      </div>

      {/* Teams and Score Input */}
      <div className="flex items-center gap-4 mb-4">
        {/* Home Team */}
        <div className="flex-1 text-center">
          {homeTeam?.logo_url && (
            <img src={homeTeam.logo_url} alt={homeTeam.name} className="w-10 h-10 object-contain mx-auto mb-1" />
          )}
          <p className="text-sm font-medium truncate">{homeTeam?.short_name || '?'}</p>
        </div>

        {/* Score Inputs */}
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min="0"
            value={homeScore}
            onChange={e => setHomeScore(e.target.value)}
            className="w-14 text-center text-lg font-bold"
            placeholder="0"
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="number"
            min="0"
            value={awayScore}
            onChange={e => setAwayScore(e.target.value)}
            className="w-14 text-center text-lg font-bold"
            placeholder="0"
          />
        </div>

        {/* Away Team */}
        <div className="flex-1 text-center">
          {awayTeam?.logo_url && (
            <img src={awayTeam.logo_url} alt={awayTeam.name} className="w-10 h-10 object-contain mx-auto mb-1" />
          )}
          <p className="text-sm font-medium truncate">{awayTeam?.short_name || '?'}</p>
        </div>
      </div>

      {/* MOTM Selection */}
      <div className="mb-4">
        <Label className="text-xs">Man of the Match</Label>
        <Select value={motmId} onValueChange={setMotmId}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select player (optional)" />
          </SelectTrigger>
          <SelectContent>
            {matchPlayers.map(player => (
              <SelectItem key={player.id} value={player.id}>
                {player.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lineup Toggle */}
      <div className="mb-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowLineup(!showLineup)}
          className="w-full"
        >
          <Users className="w-4 h-4 mr-2" />
          {showLineup ? 'Hide' : 'Add'} Players Who Played ({lineup.length} selected)
        </Button>
      </div>

      {/* Lineup Selection */}
      {showLineup && (
        <div className="mb-4 p-3 bg-muted/30 rounded-lg space-y-3">
          {/* Home Team */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs font-semibold">{homeTeam?.name}</Label>
              <Button type="button" size="sm" variant="ghost" onClick={() => selectAllTeam(match.home_team_id)}>
                {homePlayers.every(p => lineup.includes(p.id)) ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-1">
              {homePlayers.map(player => (
                <label key={player.id} className="flex items-center gap-2 p-2 rounded bg-background cursor-pointer hover:bg-muted/50">
                  <Checkbox checked={lineup.includes(player.id)} onCheckedChange={() => togglePlayer(player.id)} />
                  <span className="text-sm truncate">{player.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Away Team */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs font-semibold">{awayTeam?.name}</Label>
              <Button type="button" size="sm" variant="ghost" onClick={() => selectAllTeam(match.away_team_id)}>
                {awayPlayers.every(p => lineup.includes(p.id)) ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-1">
              {awayPlayers.map(player => (
                <label key={player.id} className="flex items-center gap-2 p-2 rounded bg-background cursor-pointer hover:bg-muted/50">
                  <Checkbox checked={lineup.includes(player.id)} onCheckedChange={() => togglePlayer(player.id)} />
                  <span className="text-sm truncate">{player.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Match Events Toggle */}
      <div className="mb-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowEvents(!showEvents)}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          {showEvents ? 'Hide' : 'Add'} Match Events (Goals, Assists, Cards)
        </Button>
      </div>

      {/* Match Events */}
      {showEvents && (
        <div className="mb-4 space-y-3 p-3 bg-muted/30 rounded-lg">
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => addEvent('goal')}>
              <Goal className="w-4 h-4 mr-1" /> Goal
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => addEvent('assist')}>
              <Handshake className="w-4 h-4 mr-1" /> Assist
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => addEvent('yellow_card')}>
              <Square className="w-3 h-3 mr-1 fill-yellow-500 text-yellow-500" /> Yellow
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => addEvent('red_card')}>
              <Square className="w-3 h-3 mr-1 fill-red-500 text-red-500" /> Red
            </Button>
          </div>

          {events.length > 0 && (
            <div className="space-y-2">
              {events.map((event, index) => (
                <div key={index} className="flex items-center gap-2 bg-background p-2 rounded-lg">
                  {getEventIcon(event.event_type)}
                  <Select
                    value={event.player_id}
                    onValueChange={v => updateEvent(index, 'player_id', v)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select player" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">{homeTeam?.name}</div>
                      {homePlayers.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                      <div className="px-2 py-1 text-xs font-semibold text-muted-foreground border-t mt-1 pt-1">{awayTeam?.name}</div>
                      {awayPlayers.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min="1"
                    max="120"
                    placeholder="Min"
                    className="w-16"
                    value={event.minute || ''}
                    onChange={e => updateEvent(index, 'minute', parseInt(e.target.value) || 0)}
                  />
                  <Button type="button" size="icon" variant="ghost" onClick={() => removeEvent(index)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={saving || homeScore === '' || awayScore === ''}
        className="w-full"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
        Save Result
      </Button>
    </div>
  );
};
