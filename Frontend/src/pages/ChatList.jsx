import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../api/client";
import OnlineStatus from "../components/OnlineStatus";
import PageBanner from "../components/PageBanner";

/**
 * The nav's "Chat" destination — an inbox of active matches to pick a
 * conversation from. The conversation itself still lives at /chat/:userId.
 */
const ChatList = () => {
  const [matches, setMatches] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    apiClient
      .get("/matches/mine")
      .then(({ data }) => setMatches(data.data?.matches || []))
      .catch((err) => {
        setErrorMsg(err.response?.data?.message || "Failed to load your chats");
        setMatches([]);
      });
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 my-6">
      <PageBanner image="/chat.webp" title="Chat">
        Conversations with the partners you've matched with.
      </PageBanner>

      {errorMsg && <p className="text-sm text-red-600 mb-3">{errorMsg}</p>}

      {matches === null ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : matches.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center">
          <p className="text-sm text-slate-600 m-0">
            No matches yet.{" "}
            <Link to="/discover" className="text-blue-600 font-medium">
              Find a partner
            </Link>{" "}
            to start a conversation.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl divide-y divide-slate-100">
          {matches.map((match) => {
            const partner = match.partner;
            const name = partner?.name || partner?.email || "Unknown";
            const initial = name.charAt(0).toUpperCase();

            return (
              <Link
                key={match._id}
                to={`/chat/${partner?._id}?name=${encodeURIComponent(name)}`}
                className="flex items-center gap-3.5 px-4 py-3.5 no-underline hover:bg-slate-50 transition-colors"
              >
                <div className="w-11 h-11 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-base shrink-0">
                  {initial}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-900 truncate">{name}</div>
                  <OnlineStatus userId={partner?._id} />
                </div>
                <span className="text-sm text-slate-400 shrink-0">Open →</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ChatList;
