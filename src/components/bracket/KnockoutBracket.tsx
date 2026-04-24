import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Trophy } from 'lucide-react';

interface Team {
  id: string;
  name: string;
  short_name: string;
  logo_url: string | null;
}

interface KnockoutMatch {
  id: string;
  match_order: number;
  team1_id: string | null;
  team2_id: string | null;
  team1_score: number | null;
  team2_score: number | null;
  team1_score_90: number | null;
  team2_score_90: number | null;
  went_to_extra_time: boolean;
  team1_penalties: number | null;
  team2_penalties: number | null;
  winner_id: string | null;
  match_date: string | null;
  venue: string | null;
  is_completed: boolean;
  is_third_place_playoff?: boolean;
  team1_seed?: number | null;
  team2_seed?: number | null;
}

interface KnockoutRound {
  id: string;
  round_name: string;
  round_order: number;
  matches: KnockoutMatch[];
}

interface KnockoutBracketProps {
  rounds: KnockoutRound[];
  teams: Team[];
  thirdPlaceMatch?: KnockoutMatch;
}

const getRoundWidth = (totalRounds: number, roundOrder: number) => {
  // Dynamic width based on round position
  const baseWidth = 160;
  return baseWidth;
};

const getMatchHeight = (totalRounds: number, roundOrder: number) => {
  // Each round's matches need more spacing as we progress
  return Math.pow(2, roundOrder - 1) * 80;
};

export const KnockoutBracket = ({ rounds, teams, thirdPlaceMatch }: KnockoutBracketProps) => {
  const sortedRounds = [...rounds].sort((a, b) => a.round_order - b.round_order);
  const getTeam = (teamId: string | null) => teams.find(t => t.id === teamId);

  if (rounds.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <p>No knockout rounds configured yet.</p>
      </div>
    );
  }

  // Find the champion (winner of final round)
  const finalRound = sortedRounds[sortedRounds.length - 1];
  const finalMatch = finalRound?.matches?.[0];
  const champion = finalMatch?.winner_id ? getTeam(finalMatch.winner_id) : null;
  
  // Find third place winner if match exists
  const thirdPlaceWinner = thirdPlaceMatch?.winner_id ? getTeam(thirdPlaceMatch.winner_id) : null;

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {sortedRounds.map((round, roundIndex) => (
          <div key={round.id} className="flex flex-col">
            {/* Round header */}
            <div className="text-center mb-4">
              <h3 className="text-sm font-display font-semibold text-foreground">
                {round.round_name}
              </h3>
              <p className="text-[10px] text-muted-foreground">
                {round.matches.length} {round.matches.length === 1 ? 'match' : 'matches'}
              </p>
            </div>

            {/* Matches */}
            <div 
              className="flex flex-col justify-around flex-1 gap-4"
              style={{ minHeight: round.matches.length * getMatchHeight(sortedRounds.length, round.round_order) }}
            >
              {round.matches
                .sort((a, b) => a.match_order - b.match_order)
                .map((match, matchIndex) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    team1={getTeam(match.team1_id)}
                    team2={getTeam(match.team2_id)}
                    roundIndex={roundIndex}
                    matchIndex={matchIndex}
                  />
                ))}
            </div>
          </div>
        ))}

        {/* Champion display */}
        {finalRound && (
          <div className="flex flex-col justify-center items-center min-w-[140px]">
            <div className="text-center mb-4">
              <Trophy className="w-8 h-8 text-gold mx-auto mb-2" />
              <h3 className="text-sm font-display font-semibold text-gold">
                Champion
              </h3>
            </div>
            {champion ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-gradient-to-br from-gold/20 to-gold/5 border-2 border-gold rounded-xl p-4 text-center"
              >
                <div className="w-12 h-12 mx-auto rounded-full bg-muted overflow-hidden mb-2">
                  {champion.logo_url ? (
                    <img src={champion.logo_url} alt={champion.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground font-display">
                      {champion.short_name?.charAt(0)}
                    </div>
                  )}
                </div>
                <p className="font-display font-semibold text-foreground text-sm">
                  {champion.short_name}
                </p>
              </motion.div>
            ) : (
              <div className="text-center text-muted-foreground text-sm p-4 border-2 border-dashed border-border rounded-xl">
                TBD
              </div>
            )}
          </div>
        )}
      </div>

      {/* Third Place Match Section */}
      {thirdPlaceMatch && (
        <div className="mt-6 pt-4 border-t border-border/50">
          <div className="flex items-center gap-4">
            <div>
              <h3 className="text-sm font-display font-semibold text-amber-500 mb-2">
                🥉 Third Place Playoff
              </h3>
              <MatchCard
                match={thirdPlaceMatch}
                team1={getTeam(thirdPlaceMatch.team1_id)}
                team2={getTeam(thirdPlaceMatch.team2_id)}
                roundIndex={0}
                matchIndex={0}
              />
            </div>
            {thirdPlaceWinner && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-gradient-to-br from-amber-500/20 to-amber-500/5 border-2 border-amber-500/50 rounded-xl p-3 text-center"
              >
                <div className="text-[10px] text-amber-500 font-semibold mb-1">3rd Place</div>
                <div className="w-10 h-10 mx-auto rounded-full bg-muted overflow-hidden mb-1">
                  {thirdPlaceWinner.logo_url ? (
                    <img src={thirdPlaceWinner.logo_url} alt={thirdPlaceWinner.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground font-display text-sm">
                      {thirdPlaceWinner.short_name?.charAt(0)}
                    </div>
                  )}
                </div>
                <p className="font-display font-semibold text-foreground text-xs">
                  {thirdPlaceWinner.short_name}
                </p>
              </motion.div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface MatchCardProps {
  match: KnockoutMatch;
  team1?: Team;
  team2?: Team;
  roundIndex: number;
  matchIndex: number;
  showSeeds?: boolean;
}

const MatchCard = ({ match, team1, team2, roundIndex, matchIndex, showSeeds = true }: MatchCardProps) => {
  const team1Won = match.winner_id === match.team1_id;
  const team2Won = match.winner_id === match.team2_id;
  const hasPenalties = match.team1_penalties !== null && match.team2_penalties !== null;
  const hasSeed1 = showSeeds && match.team1_seed !== null && match.team1_seed !== undefined;
  const hasSeed2 = showSeeds && match.team2_seed !== null && match.team2_seed !== undefined;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: roundIndex * 0.1 + matchIndex * 0.05 }}
      className="bg-gradient-card border border-border/50 rounded-lg overflow-hidden w-[160px]"
    >
      {/* Team 1 */}
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 border-b border-border/30 transition-colors",
        team1Won && "bg-victory/10",
        match.is_completed && !team1Won && "opacity-50"
      )}>
        {hasSeed1 && (
          <span className="text-[9px] font-bold text-muted-foreground w-3 text-center flex-shrink-0">
            {match.team1_seed}
          </span>
        )}
        <div className="w-5 h-5 rounded-full bg-muted overflow-hidden flex-shrink-0">
          {team1?.logo_url ? (
            <img src={team1.logo_url} alt={team1.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">
              {team1?.short_name?.charAt(0) || '?'}
            </div>
          )}
        </div>
        <span className={cn(
          "flex-1 text-xs truncate",
          team1Won && "font-semibold text-victory"
        )}>
          {team1?.short_name || 'TBD'}
        </span>
        <div className="text-right">
          <span className={cn(
            "text-xs font-display font-semibold min-w-[16px]",
            team1Won && "text-victory"
          )}>
            {match.team1_score ?? '-'}
          </span>
          {hasPenalties && (
            <span className="text-[8px] text-amber-500 ml-0.5">
              ({match.team1_penalties})
            </span>
          )}
        </div>
      </div>

      {/* Team 2 */}
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 transition-colors",
        team2Won && "bg-victory/10",
        match.is_completed && !team2Won && "opacity-50"
      )}>
        {hasSeed2 && (
          <span className="text-[9px] font-bold text-muted-foreground w-3 text-center flex-shrink-0">
            {match.team2_seed}
          </span>
        )}
        <div className="w-5 h-5 rounded-full bg-muted overflow-hidden flex-shrink-0">
          {team2?.logo_url ? (
            <img src={team2.logo_url} alt={team2.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">
              {team2?.short_name?.charAt(0) || '?'}
            </div>
          )}
        </div>
        <span className={cn(
          "flex-1 text-xs truncate",
          team2Won && "font-semibold text-victory"
        )}>
          {team2?.short_name || 'TBD'}
        </span>
        <div className="text-right">
          <span className={cn(
            "text-xs font-display font-semibold min-w-[16px]",
            team2Won && "text-victory"
          )}>
            {match.team2_score ?? '-'}
          </span>
          {hasPenalties && (
            <span className="text-[8px] text-amber-500 ml-0.5">
              ({match.team2_penalties})
            </span>
          )}
        </div>
      </div>

      {/* Match info */}
      {(match.match_date || match.went_to_extra_time || hasPenalties) && (
        <div className="px-3 py-1.5 bg-muted/50 text-[10px] text-muted-foreground text-center space-x-1">
          {match.match_date && (
            <span>{new Date(match.match_date).toLocaleDateString()}</span>
          )}
          {match.went_to_extra_time && (
            <span className="text-blue-400">(AET)</span>
          )}
          {hasPenalties && (
            <span className="text-amber-500">
              ({match.team1_penalties}-{match.team2_penalties} pens)
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default KnockoutBracket;
