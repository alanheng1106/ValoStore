"use client";

import { useI18n } from "@/i18n/context";
import Link from "next/link";

export default function MatchCard({ match }) {
  const { t } = useI18n();

  // Determine if it's a win or loss
  // teamId is 'Blue' or 'Red'
  const myTeam = match.players.all_players.find(p => p.name === match.name)?.team;
  let result = "DRAW";
  let resultColor = "text-gray-400";
  let bgColor = "bg-[#1A2332]";
  let borderClass = "border-white/5";

  if (match.teams[myTeam.toLowerCase()]?.has_won) {
    result = t("matches.win");
    resultColor = "text-[#00D4AA]";
    bgColor = "bg-[#00D4AA]/10";
    borderClass = "border-[#00D4AA]/30";
  } else if (match.teams[myTeam === 'Blue' ? 'red' : 'blue']?.has_won) {
    result = t("matches.loss");
    resultColor = "text-[#FF4655]";
    bgColor = "bg-[#FF4655]/10";
    borderClass = "border-[#FF4655]/30";
  }

  const me = match.players.all_players.find(p => p.name === match.name);
  const myStats = me?.stats;

  // Format mode
  const modeKey = `matches.${match.metadata.mode.toLowerCase()}`;
  const modeName = t(modeKey) !== modeKey ? t(modeKey) : match.metadata.mode;

  return (
    <Link href={`/dashboard/matches/${match.metadata.matchid}`} className={`block p-4 rounded-xl border ${borderClass} ${bgColor} flex flex-col md:flex-row items-center gap-6 mb-4 transition-all hover:bg-opacity-20 hover:-translate-y-1 hover:shadow-lg hover:border-white/50 cursor-pointer`}>
      {/* Agent Image */}
      <div className="w-16 h-16 shrink-0 rounded-full overflow-hidden border-2 border-white/10 bg-black">
        {me?.assets?.agent?.small && (
          <img src={me.assets.agent.small} alt={me.character} className="w-full h-full object-cover" />
        )}
      </div>

      {/* Match Details */}
      <div className="flex-1 text-center md:text-left">
        <h3 className="text-xl font-bold text-white mb-1">{match.metadata.map}</h3>
        <p className="text-sm text-gray-400">
          {modeName} • {new Date(match.metadata.game_start * 1000).toLocaleString()}
        </p>
      </div>

      {/* Score */}
      <div className="text-center md:text-right px-6 md:border-x border-white/10">
        <p className="text-sm text-gray-400 mb-1">{t("matches.score")}</p>
        <p className="text-2xl font-bold text-white tracking-widest">
          {match.teams.blue.rounds_won}:{match.teams.red.rounds_won}
        </p>
      </div>

      {/* KDA */}
      <div className="text-center md:text-right px-6">
        <p className="text-sm text-gray-400 mb-1">{t("matches.kda")}</p>
        <p className="text-xl font-bold text-white">
          {myStats?.kills} / <span className="text-[#FF4655]">{myStats?.deaths}</span> / {myStats?.assists}
        </p>
      </div>

      {/* Result Badge */}
      <div className={`shrink-0 w-24 text-center py-2 rounded-lg font-bold ${resultColor} bg-black/40`}>
        {result}
      </div>
    </Link>
  );
}
