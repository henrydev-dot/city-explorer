'use client';

import { createContext, useContext, useReducer, useEffect, useMemo, useCallback, useRef, useState } from 'react';
import { getInitialApartments, getInitialMarketListings, getEconomyStats, getAllApartments, NPC_NAMES } from '../lib/gameState';
import { getTranslations } from '../lib/i18n';
import { REFERRAL_RATE, MARKET_FEE_RATE, GAME_MONTH_SECONDS, STORAGE_KEY, MRT_PER_ETH, shortAddr, formatPrice } from '../lib/constants';

const GameContext = createContext(null);

const INITIAL_PROPOSALS = [
  {
    id: 'prop-1',
    title: 'Expand Monaco Sector to Larvotto Beach',
    titleTr: "Monaco Sektörünü Larvotto Sahili'ne Genişletme",
    description: 'Add a new high-rise residential zone on the beachfront: 5 luxury towers and 40 new apartments. Increases $MRT staking yields.',
    descriptionTr: 'Sahil şeridine 5 yeni lüks kule ve 40 yeni daire içeren bir gökdelen bölgesi ekle. $MRT stake getirisini artırır.',
    votesYes: 184500, votesNo: 23400, votesAbstain: 8900,
    endsInDays: 5, status: 'active', userVote: null,
  },
  {
    id: 'prop-2',
    title: 'Reduce Apartment Maintenance Cost by 15%',
    titleTr: 'Daire Yıllık Masraflarını %15 Düşürme',
    description: 'Lower annual maintenance for all Monaco properties by 15% using surplus treasury funds. Increases net landlord profitability.',
    descriptionTr: 'Hazine fazlasıyla tüm mülklerin yıllık masraflarını %15 azalt. Ev sahiplerinin net kârını artırır.',
    votesYes: 245900, votesNo: 12000, votesAbstain: 3200,
    endsInDays: 3, status: 'active', userVote: null,
  },
  {
    id: 'prop-3',
    title: 'Distribute 2% P2P Marketplace Fee to Holders',
    titleTr: "P2P Market Komisyonunun %2'sini Sahiplere Dağıtma",
    description: 'Route the 2% marketplace fee directly to players holding more than 50,000 $MRT.',
    descriptionTr: "P2P komisyonunu cüzdanında 50.000+ $MRT tutan oyunculara dağıtan sözleşme yükseltmesi.",
    votesYes: 98100, votesNo: 84000, votesAbstain: 12400,
    endsInDays: 9, status: 'active', userVote: null,
  },
];

const NPC_CHAT = [
  { en: 'Just picked up a sea-view suite in Larvotto 🌊', tr: 'Larvotto’da deniz manzaralı bir süit kaptım 🌊' },
  { en: 'Anyone selling near Casino Square? Paying in ETH.', tr: 'Casino Square civarında satan var mı? ETH ödüyorum.' },
  { en: 'Rent just hit my wallet. Passive income feels good 💸', tr: 'Kira cüzdana düştü. Pasif gelir güzel şey 💸' },
  { en: 'Monaco index +14.6%/yr — best market in the game.', tr: 'Monaco endeksi yıllık +%14,6 — oyunun en iyi piyasası.' },
  { en: 'Voted YES on the Larvotto expansion. More supply!', tr: 'Larvotto genişlemesine EVET oyu verdim. Daha çok arz!' },
  { en: 'Penthouse prices are wild this season 🏙️', tr: 'Bu sezon penthouse fiyatları uçmuş 🏙️' },
  { en: 'Listed my Port Hercule unit, DM for details.', tr: 'Port Hercule dairemi satışa koydum, ilgilenen yazsın.' },
  { en: 'Tip: premium suites accept both ETH and $MRT.', tr: 'İpucu: premium süitler hem ETH hem $MRT kabul ediyor.' },
];

function initialState() {
  return {
    balance: 65000,
    ethBalance: 1.5,
    apartments: getInitialApartments(),
    listings: getInitialMarketListings(),
    proposals: INITIAL_PROPOSALS,
    referredBy: '',
    referrals: [],
    refEarnMRT: 0,
    refEarnETH: 0,
    refLogs: [],
    activity: [],       // { id, type, text, textTr, ts }
    chat: [],           // { id, author, text, ts, you }
    ownedSince: {},     // aptId -> ts (for appreciation)
    hydrated: false,
  };
}

function pushActivity(state, entry) {
  return [{ id: `${entry.ts}-${Math.random().toString(36).slice(2, 7)}`, ...entry }, ...state.activity].slice(0, 40);
}

function updateApt(apartments, buildingIdx, aptId, patch) {
  const arr = apartments[buildingIdx];
  if (!arr) return apartments;
  return { ...apartments, [buildingIdx]: arr.map((a) => (a.id === aptId ? { ...a, ...patch } : a)) };
}

function reducer(state, action) {
  switch (action.type) {
    case 'HYDRATE': {
      const saved = action.payload;
      // Merge saved player progress over the (possibly newer) catalog.
      return { ...state, ...saved, hydrated: true };
    }
    case 'MARK_HYDRATED':
      return { ...state, hydrated: true };

    case 'BUY_APARTMENT': {
      const { buildingIdx, aptId, currency, ts } = action;
      const apt = (state.apartments[buildingIdx] || []).find((a) => a.id === aptId);
      if (!apt || apt.status !== 'available') return state;

      const isEth = currency === 'ETH';
      if (apt.currency !== 'BOTH' && apt.currency !== currency) return state;
      const cost = isEth ? apt.priceEth : apt.price;
      if ((isEth ? state.ethBalance : state.balance) < cost) return state;

      const next = {
        ...state,
        balance: isEth ? state.balance : state.balance - cost,
        ethBalance: isEth ? Number((state.ethBalance - cost).toFixed(4)) : state.ethBalance,
        apartments: updateApt(state.apartments, buildingIdx, aptId, { status: 'owned', owner: null }),
        ownedSince: { ...state.ownedSince, [aptId]: ts },
      };
      next.activity = pushActivity(state, {
        ts, type: 'buy',
        text: `Purchased ${apt.unitEn} for ${formatPrice(cost, currency)}`,
        textTr: `${apt.unit} ${formatPrice(cost, currency)} karşılığında satın alındı`,
      });
      return next;
    }

    case 'LIST_APARTMENT': {
      const { buildingIdx, aptId, price, currency, ts } = action;
      const apt = (state.apartments[buildingIdx] || []).find((a) => a.id === aptId);
      if (!apt || apt.status !== 'owned' || !(price > 0)) return state;
      const listing = {
        id: `list-${ts}-${aptId}`,
        buildingIndex: buildingIdx,
        aptId,
        seller: 'You',
        price,
        currency,
      };
      return {
        ...state,
        listings: [...state.listings, listing],
        apartments: updateApt(state.apartments, buildingIdx, aptId, { status: 'listed' }),
        activity: pushActivity(state, {
          ts, type: 'list',
          text: `Listed ${apt.unitEn} for ${formatPrice(price, currency)}`,
          textTr: `${apt.unit} ${formatPrice(price, currency)} fiyatla satışa çıkarıldı`,
        }),
      };
    }

    case 'CANCEL_LISTING': {
      const { listingId, ts } = action;
      const listing = state.listings.find((l) => l.id === listingId);
      if (!listing || listing.seller !== 'You') return state;
      return {
        ...state,
        listings: state.listings.filter((l) => l.id !== listingId),
        apartments: updateApt(state.apartments, listing.buildingIndex, listing.aptId, { status: 'owned' }),
        activity: pushActivity(state, {
          ts, type: 'cancel',
          text: 'Listing cancelled — unit returned to portfolio',
          textTr: 'İlan iptal edildi — daire portföye geri döndü',
        }),
      };
    }

    case 'BUY_LISTING': {
      const { listingId, ts } = action;
      const listing = state.listings.find((l) => l.id === listingId);
      if (!listing || listing.seller === 'You') return state;
      const apt = (state.apartments[listing.buildingIndex] || []).find((a) => a.id === listing.aptId);
      if (!apt) return state;

      const isEth = listing.currency === 'ETH';
      if ((isEth ? state.ethBalance : state.balance) < listing.price) return state;

      return {
        ...state,
        balance: isEth ? state.balance : state.balance - listing.price,
        ethBalance: isEth ? Number((state.ethBalance - listing.price).toFixed(4)) : state.ethBalance,
        listings: state.listings.filter((l) => l.id !== listingId),
        apartments: updateApt(state.apartments, listing.buildingIndex, listing.aptId, { status: 'owned', owner: null }),
        ownedSince: { ...state.ownedSince, [listing.aptId]: ts },
        activity: pushActivity(state, {
          ts, type: 'buy',
          text: `Bought ${apt.unitEn} from ${listing.seller} for ${formatPrice(listing.price, listing.currency)}`,
          textTr: `${apt.unit}, ${listing.seller} oyuncusundan ${formatPrice(listing.price, listing.currency)} karşılığında alındı`,
        }),
      };
    }

    case 'NPC_BUY_LISTING': {
      const { listingId, npcName, ts } = action;
      const listing = state.listings.find((l) => l.id === listingId);
      if (!listing || listing.seller !== 'You') return state;
      const apt = (state.apartments[listing.buildingIndex] || []).find((a) => a.id === listing.aptId);
      const isEth = listing.currency === 'ETH';
      const fee = listing.price * MARKET_FEE_RATE;
      const net = listing.price - fee;

      return {
        ...state,
        balance: isEth ? state.balance : state.balance + Math.round(net),
        ethBalance: isEth ? Number((state.ethBalance + net).toFixed(4)) : state.ethBalance,
        listings: state.listings.filter((l) => l.id !== listingId),
        apartments: updateApt(state.apartments, listing.buildingIndex, listing.aptId, { status: 'taken', owner: npcName }),
        activity: pushActivity(state, {
          ts, type: 'sold',
          text: `${npcName} bought your ${apt?.unitEn || 'unit'} for ${formatPrice(listing.price, listing.currency)} (2% fee deducted)`,
          textTr: `${npcName}, ${apt?.unit || 'dairenizi'} ${formatPrice(listing.price, listing.currency)} karşılığında satın aldı (%2 komisyon kesildi)`,
        }),
      };
    }

    case 'VOTE': {
      const { proposalId, option, weight, ts } = action;
      const prop = state.proposals.find((p) => p.id === proposalId);
      if (!prop || prop.userVote) return state;
      return {
        ...state,
        proposals: state.proposals.map((p) =>
          p.id !== proposalId ? p : {
            ...p,
            userVote: option,
            votesYes: p.votesYes + (option === 'yes' ? weight : 0),
            votesNo: p.votesNo + (option === 'no' ? weight : 0),
            votesAbstain: p.votesAbstain + (option === 'abstain' ? weight : 0),
          }),
        activity: pushActivity(state, {
          ts, type: 'vote',
          text: `Voted ${option.toUpperCase()} with ${weight.toLocaleString('en-US')} points`,
          textTr: `${weight.toLocaleString('en-US')} oy gücüyle ${option.toUpperCase()} oyu kullanıldı`,
        }),
      };
    }

    case 'SET_REFERRER':
      return { ...state, referredBy: action.address };

    case 'ADD_REFERRAL': {
      if (state.referrals.includes(action.address)) return state;
      return { ...state, referrals: [...state.referrals, action.address] };
    }

    case 'REFERRAL_SPEND': {
      const { isEth, spend, commission, address, ts } = action;
      return {
        ...state,
        balance: isEth ? state.balance : state.balance + commission,
        ethBalance: isEth ? Number((state.ethBalance + commission).toFixed(4)) : state.ethBalance,
        refEarnMRT: isEth ? state.refEarnMRT : state.refEarnMRT + commission,
        refEarnETH: isEth ? Number((state.refEarnETH + commission).toFixed(4)) : state.refEarnETH,
        refLogs: [{
          id: ts,
          address: shortAddr(address),
          amount: formatPrice(spend, isEth ? 'ETH' : 'MRT'),
          commission: formatPrice(commission, isEth ? 'ETH' : 'MRT'),
          ts,
        }, ...state.refLogs].slice(0, 30),
      };
    }

    case 'INCOME_TICK':
      return { ...state, balance: state.balance + action.amount };

    case 'ADD_CHAT':
      return { ...state, chat: [...state.chat, action.message].slice(-80) };

    case 'MERGE_CHAT': {
      // Merge server messages, dedupe by id, keep chronological order.
      const known = new Set(state.chat.map((m) => m.id));
      const fresh = action.messages.filter((m) => !known.has(m.id));
      if (fresh.length === 0) return state;
      return { ...state, chat: [...state.chat, ...fresh].sort((a, b) => a.ts - b.ts).slice(-80) };
    }

    case 'RESET_GAME':
      return { ...initialState(), hydrated: true };

    default:
      return state;
  }
}

// Fields persisted to localStorage (catalog-derived data included so player
// progress survives reloads).
const PERSIST_KEYS = ['balance', 'ethBalance', 'apartments', 'listings', 'proposals', 'referredBy', 'referrals', 'refEarnMRT', 'refEarnETH', 'refLogs', 'activity', 'ownedSince'];

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const [lang, setLang] = useState('en');
  const [notifications, setNotifications] = useState([]);
  const [chatOnline, setChatOnline] = useState(false);
  const playerIdRef = useRef(null);
  const t = useMemo(() => getTranslations(lang), [lang]);

  // Latest lang/state snapshots for interval callbacks & imperative actions.
  const langRef = useRef(lang);
  useEffect(() => { langRef.current = lang; }, [lang]);
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const notify = useCallback((textEn, textTr, type = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const text = langRef.current === 'tr' ? textTr || textEn : textEn;
    setNotifications((prev) => [...prev.slice(-3), { id, text, type }]);
    setTimeout(() => setNotifications((prev) => prev.filter((n) => n.id !== id)), 5000);
  }, []);

  // ── Hydrate: localStorage first, then the MongoDB cloud save (server wins) ──
  useEffect(() => {
    // Stable anonymous player id used for cloud saves and chat identity.
    let playerId;
    try {
      playerId = localStorage.getItem('monaco-player-id');
      if (!playerId) {
        playerId = `p_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
        localStorage.setItem('monaco-player-id', playerId);
      }
    } catch {
      playerId = `p_${Math.random().toString(36).slice(2, 14)}`;
    }
    playerIdRef.current = playerId;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) dispatch({ type: 'HYDRATE', payload: JSON.parse(raw) });
      else dispatch({ type: 'MARK_HYDRATED' });
    } catch {
      dispatch({ type: 'MARK_HYDRATED' });
    }

    // Best-effort cloud restore — ignored when Mongo isn't configured.
    fetch(`/api/save?player=${playerId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.ok && data.save) dispatch({ type: 'HYDRATE', payload: data.save });
      })
      .catch(() => { /* offline mode */ });
  }, []);

  // ── Persist: localStorage immediately, MongoDB debounced ──
  useEffect(() => {
    if (!state.hydrated) return undefined;
    const snapshot = {};
    PERSIST_KEYS.forEach((k) => { snapshot[k] = state[k]; });
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot)); } catch { /* storage full/blocked */ }

    const timer = setTimeout(() => {
      if (!playerIdRef.current) return;
      fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player: playerIdRef.current, save: snapshot }),
      }).catch(() => { /* offline mode */ });
    }, 3000);
    return () => clearTimeout(timer);
  }, [state]);

  // ── Derived economy ──
  const economyStats = useMemo(() => getEconomyStats(state.apartments), [state.apartments]);

  const { totalIncome, totalCost, portfolioValue } = useMemo(() => {
    let income = 0, cost = 0, value = 0;
    getAllApartments(state.apartments).forEach((apt) => {
      if (apt.status === 'owned' || apt.status === 'listed') {
        income += apt.rentIncome;
        cost += apt.annualCost;
        value += apt.price;
      }
    });
    return { totalIncome: income, totalCost: cost, portfolioValue: value };
  }, [state.apartments]);

  // Net rent per game-month (rent minus pro-rata maintenance).
  const netMonthly = useMemo(() => Math.max(0, Math.round(totalIncome - totalCost / 12)), [totalIncome, totalCost]);

  // ── Passive rent stream: 1 game month ≈ 1 minute ──
  useEffect(() => {
    if (netMonthly <= 0) return undefined;
    const perTick = Math.max(1, Math.round(netMonthly / GAME_MONTH_SECONDS));
    const interval = setInterval(() => dispatch({ type: 'INCOME_TICK', amount: perTick }), 1000);
    return () => clearInterval(interval);
  }, [netMonthly]);

  // ── Referral link detection (?ref=0x…) ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref && /^0x[a-fA-F0-9]{40}$/.test(ref)) {
      dispatch({ type: 'SET_REFERRER', address: ref });
      notify(`Invited by ${shortAddr(ref)} — your referrer earns 20% commission`, `${shortAddr(ref)} tarafından davet edildiniz — davet eden %20 komisyon kazanır`, 'success');
    }
  }, [notify]);

  // ── NPC market simulation: occasionally buy player listings ──
  useEffect(() => {
    const interval = setInterval(() => {
      const s = stateRef.current;
      const mine = s.listings.filter((l) => l.seller === 'You');
      if (mine.length > 0 && Math.random() < 0.2) {
        const listing = mine[Math.floor(Math.random() * mine.length)];
        const npcName = NPC_NAMES[Math.floor(Math.random() * NPC_NAMES.length)];
        dispatch({ type: 'NPC_BUY_LISTING', listingId: listing.id, npcName, ts: Date.now() });
        notify(
          `${npcName} bought your listing for ${formatPrice(listing.price, listing.currency)}!`,
          `${npcName} ilanınızı ${formatPrice(listing.price, listing.currency)} karşılığında satın aldı!`,
          'success'
        );
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [notify]);

  // ── Live chat: poll MongoDB-backed /api/chat; real messages from other players ──
  useEffect(() => {
    let stopped = false;
    let after = 0;
    const poll = async () => {
      try {
        const res = await fetch(`/api/chat?after=${after}`);
        if (!res.ok) throw new Error('chat offline');
        const data = await res.json();
        if (stopped || !data.ok) return;
        setChatOnline(true);
        if (data.messages.length > 0) {
          after = data.messages[data.messages.length - 1].ts;
          dispatch({
            type: 'MERGE_CHAT',
            messages: data.messages.map((m) => ({ ...m, you: m.player && m.player === playerIdRef.current })),
          });
        }
      } catch {
        if (!stopped) setChatOnline(false);
      }
    };
    poll();
    const interval = setInterval(poll, 8000);
    return () => { stopped = true; clearInterval(interval); };
  }, []);

  // ── NPC chat fallback keeps the city alive when Mongo isn't reachable ──
  useEffect(() => {
    if (chatOnline) return undefined;
    let timeout;
    const schedule = () => {
      timeout = setTimeout(() => {
        const msg = NPC_CHAT[Math.floor(Math.random() * NPC_CHAT.length)];
        const author = NPC_NAMES[Math.floor(Math.random() * NPC_NAMES.length)];
        dispatch({
          type: 'ADD_CHAT',
          message: { id: `${Date.now()}-npc`, author, text: langRef.current === 'tr' ? msg.tr : msg.en, ts: Date.now(), you: false },
        });
        schedule();
      }, 12000 + Math.random() * 25000);
    };
    schedule();
    return () => clearTimeout(timeout);
  }, [chatOnline]);

  // ── Player actions ──
  const buyApartment = useCallback((buildingIdx, aptId, currency = 'MRT') => {
    const s = stateRef.current;
    const apt = (s.apartments[buildingIdx] || []).find((a) => a.id === aptId);
    if (!apt || apt.status !== 'available') return;
    if (apt.currency !== 'BOTH' && apt.currency !== currency) return;

    const isEth = currency === 'ETH';
    const cost = isEth ? apt.priceEth : apt.price;
    if ((isEth ? s.ethBalance : s.balance) < cost) {
      notify(getTranslations('en').insufficientBalance, getTranslations('tr').insufficientBalance, 'error');
      return;
    }
    dispatch({ type: 'BUY_APARTMENT', buildingIdx, aptId, currency, ts: Date.now() });
    notify(`Purchased ${apt.unitEn} for ${formatPrice(cost, currency)}!`, `${apt.unit} ${formatPrice(cost, currency)} karşılığında satın alındı!`, 'success');
    if (s.referredBy) {
      const commission = cost * REFERRAL_RATE;
      notify(
        `20% referral commission (${formatPrice(commission, currency)}) routed to ${shortAddr(s.referredBy)}`,
        `%20 referans komisyonu (${formatPrice(commission, currency)}) ${shortAddr(s.referredBy)} adresine gönderildi`,
        'info'
      );
    }
  }, [notify]);

  const listApartment = useCallback((buildingIdx, aptId, price, currency) => {
    const parsed = parseFloat(price);
    if (Number.isNaN(parsed) || parsed <= 0) {
      notify('Please enter a valid price.', 'Lütfen geçerli bir fiyat girin.', 'error');
      return false;
    }
    dispatch({ type: 'LIST_APARTMENT', buildingIdx, aptId, price: parsed, currency, ts: Date.now() });
    notify(
      `Listed on the marketplace for ${formatPrice(parsed, currency)}`,
      `${formatPrice(parsed, currency)} fiyatla pazara eklendi`,
      'success'
    );
    return true;
  }, [notify]);

  const cancelListing = useCallback((listingId) => {
    dispatch({ type: 'CANCEL_LISTING', listingId, ts: Date.now() });
    notify('Listing cancelled — unit returned to your portfolio.', 'İlan iptal edildi — daire portföyünüze döndü.', 'info');
  }, [notify]);

  const buyListing = useCallback((listingId) => {
    const s = stateRef.current;
    const listing = s.listings.find((l) => l.id === listingId);
    if (!listing) return;
    const isEth = listing.currency === 'ETH';
    if ((isEth ? s.ethBalance : s.balance) < listing.price) {
      notify(getTranslations('en').insufficientBalance, getTranslations('tr').insufficientBalance, 'error');
      return;
    }
    dispatch({ type: 'BUY_LISTING', listingId, ts: Date.now() });
    notify(
      `Purchased from ${listing.seller} for ${formatPrice(listing.price, listing.currency)}!`,
      `${listing.seller} oyuncusundan ${formatPrice(listing.price, listing.currency)} karşılığında satın alındı!`,
      'success'
    );
  }, [notify]);

  const castVote = useCallback((proposalId, option, isConnected) => {
    if (!isConnected) {
      notify(getTranslations('en').walletRequired, getTranslations('tr').walletRequired, 'error');
      return;
    }
    const s = stateRef.current;
    const weight = Math.round(s.balance) + getEconomyStats(s.apartments).yours * 10000;
    dispatch({ type: 'VOTE', proposalId, option, weight, ts: Date.now() });
    notify(
      `Cast ${weight.toLocaleString('en-US')} votes: ${option.toUpperCase()}`,
      `${weight.toLocaleString('en-US')} oy gücüyle ${option.toUpperCase()} oyu verildi`,
      'success'
    );
  }, [notify]);

  const addReferral = useCallback((address) => {
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      notify('Please enter a valid wallet address.', 'Lütfen geçerli bir cüzdan adresi girin.', 'error');
      return false;
    }
    if (stateRef.current.referrals.includes(address)) {
      notify('This address is already registered.', 'Bu adres zaten kayıtlı.', 'error');
      return false;
    }
    dispatch({ type: 'ADD_REFERRAL', address });
    notify('New referred player registered!', 'Yeni davetli oyuncu eklendi!', 'success');
    return true;
  }, [notify]);

  const simulateReferralSpend = useCallback(() => {
    const s = stateRef.current;
    if (s.referrals.length === 0) {
      notify('Add a referred player first.', 'Önce davetli bir oyuncu ekleyin.', 'error');
      return;
    }
    const address = s.referrals[Math.floor(Math.random() * s.referrals.length)];
    const isEth = Math.random() > 0.5;
    const spend = isEth ? Number((Math.random() * 0.8 + 0.1).toFixed(2)) : Math.floor(Math.random() * 8000 + 2000);
    const commission = isEth ? Number((spend * REFERRAL_RATE).toFixed(3)) : Math.floor(spend * REFERRAL_RATE);
    dispatch({ type: 'REFERRAL_SPEND', isEth, spend, commission, address, ts: Date.now() });
    notify(
      `${shortAddr(address)} spent ${formatPrice(spend, isEth ? 'ETH' : 'MRT')} — you earned ${formatPrice(commission, isEth ? 'ETH' : 'MRT')} (20%)`,
      `${shortAddr(address)} ${formatPrice(spend, isEth ? 'ETH' : 'MRT')} harcadı — %20 komisyon kazandınız (${formatPrice(commission, isEth ? 'ETH' : 'MRT')})`,
      'success'
    );
  }, [notify]);

  const sendChat = useCallback(async (text, author) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const name = author || 'You';

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author: name, text: trimmed, player: playerIdRef.current }),
      });
      const data = res.ok ? await res.json() : null;
      if (data?.ok) {
        dispatch({ type: 'MERGE_CHAT', messages: [{ ...data.message, you: true }] });
        return;
      }
      throw new Error('chat offline');
    } catch {
      // Local-only fallback.
      dispatch({
        type: 'ADD_CHAT',
        message: { id: `${Date.now()}-you`, author: name, text: trimmed.slice(0, 240), ts: Date.now(), you: true },
      });
    }
  }, []);

  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET_GAME' });
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
    notify('Game progress reset.', 'Oyun ilerlemesi sıfırlandı.', 'info');
  }, [notify]);

  const value = useMemo(() => ({
    ...state,
    lang, setLang, t,
    notifications, notify, chatOnline,
    economyStats, totalIncome, totalCost, netMonthly, portfolioValue,
    buyApartment, listApartment, cancelListing, buyListing,
    castVote, addReferral, simulateReferralSpend, sendChat, resetGame,
    mrtPerEth: MRT_PER_ETH,
  }), [state, lang, t, notifications, notify, chatOnline, economyStats, totalIncome, totalCost, netMonthly, portfolioValue,
    buyApartment, listApartment, cancelListing, buyListing, castVote, addReferral, simulateReferralSpend, sendChat, resetGame]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside <GameProvider>');
  return ctx;
}
