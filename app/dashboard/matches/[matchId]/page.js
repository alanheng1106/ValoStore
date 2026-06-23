"use client";

import { useI18n } from "@/i18n/context";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function MatchDetails() {
  const { t } = useI18n();
  const { matchId } = useParams();
  const router = useRouter();
  
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/match/${matchId}`)
      .then(res => {
        if (!res.ok) throw new Error("Match not found");
        return res.json();
      })
      .then(data => {
        setMatch(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError("Failed to load match details.");
        setLoading(false);
      });
  }, [matchId]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center pb-20">
        <div className="w-12 h-12 border-4 border-[#FF4655] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="flex flex-col h-full items-center justify-center space-y-4 pb-20 text-center">
        <p className="text-[#FF4655] text-xl font-bold">{error}</p>
        <button onClick={() => router.push("/dashboard/matches")} className="text-white hover:text-[#FF4655] transition-colors underline">
          Back to Matches
        </button>
      </div>
    );
  }

  const modeKey = `matches.${match.metadata.mode.toLowerCase()}`;
  const modeName = t(modeKey) !== modeKey ? t(modeKey) : match.metadata.mode;
  const roundsPlayed = match.metadata.rounds_played;

  const blueTeam = match.players.all_players.filter(p => p.team === 'Blue');
  const redTeam = match.players.all_players.filter(p => p.team === 'Red');

  // Sort players by ACS (score)
  blueTeam.sort((a, b) => b.stats.score - a.stats.score);
  redTeam.sort((a, b) => b.stats.score - a.stats.score);

  const renderTeamTable = (teamName, players, teamData) => {
    const isWinner = teamData?.has_won;
    const teamColor = teamName === 'Blue' ? 'text-[#00D4AA]' : 'text-[#FF4655]';
    const bgHeaderColor = teamName === 'Blue' ? 'bg-[#00D4AA]/10' : 'bg-[#FF4655]/10';

    return (
      <div className="mb-8">
        <div className={`flex justify-between items-center p-4 rounded-t-xl ${bgHeaderColor} border-b border-white/10`}>
          <div className="flex items-center gap-4">
            <h2 className={`text-2xl font-bold ${teamColor}`}>{teamName} Team</h2>
            {isWinner && <span className="px-2 py-1 bg-white/10 rounded text-sm font-bold text-white">WINNER</span>}
          </div>
          <div className={`text-3xl font-black ${teamColor}`}>
            {teamData?.rounds_won || 0}
          </div>
        </div>
        
        <div className="overflow-x-auto bg-[#1A2332] rounded-b-xl border border-t-0 border-white/10">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-black/40 text-gray-400 text-sm">
              <tr>
                <th className="p-4 font-normal">Player</th>
                <th className="p-4 font-normal text-right">ACS</th>
                <th className="p-4 font-normal text-right">K / D / A</th>
                <th className="p-4 font-normal text-right">HS%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {players.map(p => {
                const acs = roundsPlayed > 0 ? Math.round(p.stats.score / roundsPlayed) : 0;
                const totalShots = p.stats.headshots + p.stats.bodyshots + p.stats.legshots;
                const hsPercent = totalShots > 0 ? Math.round((p.stats.headshots / totalShots) * 100) : 0;
                
                return (
                  <tr key={p.puuid} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded overflow-hidden bg-black/50 border border-white/10">
                          {p.assets?.agent?.small && (
                            <img src={p.assets.agent.small} alt={p.character} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-white text-lg">
                            {p.name} <span className="text-gray-500 text-sm font-normal">#{p.tag}</span>
                          </div>
                          <div className="text-sm text-gray-400 flex items-center gap-2">
                            {p.assets?.card?.small && (
                              <img src={p.assets.card.small} alt="banner" className="w-6 h-2 object-cover rounded-sm hidden md:block" />
                            )}
                            {p.currenttier_patched || 'Unrated'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right font-bold text-white">{acs}</td>
                    <td className="p-4 text-right">
                      <span className="font-bold text-white">{p.stats.kills}</span>
                      <span className="text-gray-500 mx-1">/</span>
                      <span className="font-bold text-[#FF4655]">{p.stats.deaths}</span>
                      <span className="text-gray-500 mx-1">/</span>
                      <span className="font-bold text-gray-300">{p.stats.assists}</span>
                    </td>
                    <td className="p-4 text-right font-bold text-gray-300">{hsPercent}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto w-full pb-20 animate-fade-in">
      {/* Header Back Button */}
      <Link href="/dashboard/matches" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 group">
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        Back to Matches
      </Link>

      {/* Match Header */}
      <div className="relative rounded-2xl overflow-hidden mb-8 border border-white/10 bg-[#1A2332] shadow-2xl">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-r from-[#1A2332] via-[#1A2332]/80 to-transparent z-10" />
          <img 
            src={`https://media.valorant-api.com/maps/${match.metadata.map.toLowerCase().replace(" ", "")}/splash.png`} 
            alt={match.metadata.map}
            className="w-full h-full object-cover object-right"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
        
        <div className="relative z-20 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-white tracking-widest uppercase mb-2 drop-shadow-lg">
              {match.metadata.map}
            </h1>
            <p className="text-xl text-gray-300 font-medium">
              {modeName} • {new Date(match.metadata.game_start * 1000).toLocaleString()}
            </p>
          </div>
          
          <div className="flex items-center gap-8 bg-black/40 p-4 rounded-xl backdrop-blur-sm border border-white/5">
            <div className="text-center">
              <p className="text-[#00D4AA] font-bold mb-1">BLUE</p>
              <p className="text-4xl font-black text-white">{match.teams.blue?.rounds_won || 0}</p>
            </div>
            <div className="text-2xl text-gray-500 font-black">-</div>
            <div className="text-center">
              <p className="text-[#FF4655] font-bold mb-1">RED</p>
              <p className="text-4xl font-black text-white">{match.teams.red?.rounds_won || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scoreboards */}
      <div className="space-y-8">
        {renderTeamTable('Blue', blueTeam, match.teams.blue)}
        {renderTeamTable('Red', redTeam, match.teams.red)}
      </div>
    </div>
  );
}
