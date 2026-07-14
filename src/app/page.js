'use client';

import { useState, useRef, useCallback, Suspense, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import CityScene from '../components/CityScene';
import BuildingPanel from '../components/BuildingPanel';
import HUD from '../components/HUD';
import LoadingScreen from '../components/LoadingScreen';
import { getTranslations } from '../lib/i18n';
import { getInitialApartments, getInitialMarketListings, getEconomyStats } from '../lib/gameState';
import { TrendingUpIcon, FlashIcon } from '../components/Icons';

// Inline simple icons for dashboards
function VoteCheckIcon() {
  return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" /></svg>);
}
function CopyIcon() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>);
}
function SparkleIcon() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>);
}
function ArrowLeftIcon() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>);
}

const INITIAL_PROPOSALS = [
  {
    id: 'prop-1',
    title: 'Expand Monaco Sector to Larvotto Beach',
    titleTr: 'Monaco Sektörünü Larvotto Sahili\'ne Genişletme',
    description: 'Add a new high-rise residential building zone on the beachfront, introducing 5 luxury towers and 40 new apartments. This expansion increases $MRT staking yields.',
    descriptionTr: 'Sahil şeridine 5 yeni lüks kule ve 40 yeni daire içeren yeni bir gökdelen yerleşim bölgesi ekleyin. Bu genişleme $MRT stake getirisini artıracaktır.',
    votesYes: 184500,
    votesNo: 23400,
    votesAbstain: 8900,
    status: 'active',
    userVote: null
  },
  {
    id: 'prop-2',
    title: 'Reduce Apartment Maintenance Cost by 15%',
    titleTr: 'Daire Yıllık Masraflarını %15 Düşürme',
    description: 'Governance proposal to lower annual maintenance costs for all Monaco properties by 15% using surplus treasury funds. Increases net profitability for landlords.',
    descriptionTr: 'Hazine fazlası fonları kullanarak tüm Monaco mülklerinin yıllık masraflarını %15 oranında azaltma teklifi. Ev sahipleri için net karlılığı artırır.',
    votesYes: 245900,
    votesNo: 12000,
    votesAbstain: 3200,
    status: 'active',
    userVote: null
  },
  {
    id: 'prop-3',
    title: 'Distribute 2% P2P Marketplace Fee to Holders',
    titleTr: 'P2P Market Komisyonunun %2\'sini Sahiplere Dağıtma',
    description: 'Implement a smart contract upgrade that routes 2% of all peer-to-peer marketplace sales fees directly to players holding more than 50,000 $MRT in their wallets.',
    descriptionTr: 'P2P pazar satış komisyonunun %2\'sini cüzdanında 50.000\'den fazla $MRT tutan oyunculara doğrudan dağıtan akıllı sözleşme yükseltmesi.',
    votesYes: 98100,
    votesNo: 84000,
    votesAbstain: 12400,
    status: 'active',
    userVote: null
  }
];

export default function Home() {
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [balance, setBalance] = useState(65000); // Initial balance in $MRT
  const [ethBalance, setEthBalance] = useState(1.5); // Initial ETH balance
  const [apartments, setApartments] = useState(() => getInitialApartments());
  const [marketListings, setMarketListings] = useState(() => getInitialMarketListings());
  
  // Dashboard & Loading Transition States
  const [activeModal, setActiveModal] = useState(null); // 'marketplace' | 'inventory' | 'profile' | 'vote' | 'referrals'
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [transitioningPage, setTransitioningPage] = useState(null);
  
  // Referrals state
  const [referredBy, setReferredBy] = useState('');
  const [referralsList, setReferralsList] = useState(['0x5c72b9a7A3482d8b584D7e2b85a3C909f8728d2b', '0x1F2C9a4c58e7d23d88b4D7e2b85a3C909f8728d7d', '0x88C9d2e1f9a8b348d2b584d7e2b85a3C909f8729f8b']);
  const [referralEarningsMRT, setReferralEarningsMRT] = useState(12500);
  const [referralEarningsETH, setReferralEarningsETH] = useState(0.12);
  const [referralLogs, setReferralLogs] = useState([
    { id: 1, address: '0x5c72...8d2b', amount: '8,000 $MRT', commission: '1,600 $MRT', time: '1 day ago' },
    { id: 2, address: '0x1F2C...8d7d', amount: '0.25 ETH', commission: '0.05 ETH', time: '12 hours ago' },
    { id: 3, address: '0x88C9...9f8b', amount: '4,500 $MRT', commission: '900 $MRT', time: '3 hours ago' }
  ]);
  const [simAddress, setSimAddress] = useState('0x6f31A8582b2C9a48d2b584d7e2b85a3C909f872d8b');

  // Governance Proposals
  const [proposals, setProposals] = useState(INITIAL_PROPOSALS);

  // In-line Listing Form State
  const [listingForm, setListingForm] = useState(null); // { buildingIdx, aptId, price: '', currency: 'MRT' }

  // Notifications Toast State
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((text, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  const [cameraTarget, setCameraTarget] = useState(null);
  const [lang, setLang] = useState('en'); // Default to English as requested
  const [wallet, setWallet] = useState(null); // { address, shortAddress, provider }
  const [isRainbowOpen, setIsRainbowOpen] = useState(false);
  const controlsRef = useRef();

  const t = useMemo(() => getTranslations(lang), [lang]);

  // Monaco appreciation metric: 14.6% annual appreciation
  const appreciationRate = 14.6;

  // Economy stats
  const economyStats = useMemo(() => getEconomyStats(apartments), [apartments]);

  // Income/cost from owned properties
  const { totalIncome, totalCost } = useMemo(() => {
    let income = 0, cost = 0;
    Object.values(apartments).forEach(arr => {
      arr.forEach(apt => {
        if (apt.status === 'owned' || apt.status === 'listed') {
          income += apt.rentIncome;
          cost += apt.annualCost;
        }
      });
    });
    return { totalIncome: income, totalCost: cost };
  }, [apartments]);

  // Gamified real-time passive income ticking (ticks every second if user owns properties)
  useEffect(() => {
    if (totalIncome <= 0) return;
    const interval = setInterval(() => {
      const tickIncome = Math.max(1, Math.round(totalIncome / 60));
      setBalance(b => b + tickIncome);
    }, 1000);
    return () => clearInterval(interval);
  }, [totalIncome]);

  // Read referrer code from URL search parameters on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref && /^0x[a-fA-F0-9]{40}$/.test(ref)) {
      setReferredBy(ref);
      localStorage.setItem('referredBy', ref);
      addNotification(lang === 'en' ? `Invited by: ${ref.slice(0, 6)}...${ref.slice(-4)}` : `Referans daveti algılandı: ${ref.slice(0, 6)}...${ref.slice(-4)}`, 'success');
    } else {
      const stored = localStorage.getItem('referredBy');
      if (stored) setReferredBy(stored);
    }
  }, [lang, addNotification]);

  // P2P NPC Background Buyer Loop
  useEffect(() => {
    const interval = setInterval(() => {
      const playerListings = marketListings.filter(l => l.seller === 'You');
      if (playerListings.length === 0) return;

      // 15% chance to buy every 20s
      if (Math.random() < 0.15) {
        const listingToBuy = playerListings[Math.floor(Math.random() * playerListings.length)];
        const npcAddr = '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
        const shortNpc = npcAddr.slice(0, 6) + '...' + npcAddr.slice(-4);

        // Remove from listings
        setMarketListings(prev => prev.filter(l => l.id !== listingToBuy.id));

        // Change apartment status from listed to taken
        setApartments(prev => {
          const arr = prev[listingToBuy.buildingIndex];
          if (!arr) return prev;
          return {
            ...prev,
            [listingToBuy.buildingIndex]: arr.map(a => a.id === listingToBuy.aptId ? { ...a, status: 'taken', owner: shortNpc } : a)
          };
        });

        // Credit balance depending on listing currency
        if (listingToBuy.currency === 'ETH') {
          setEthBalance(b => b + listingToBuy.price);
          addNotification(lang === 'en' 
            ? `Your listed Apt ${listingToBuy.unit} was bought by ${shortNpc} for ${listingToBuy.price} ETH!` 
            : `Satışta olan ${listingToBuy.unit} daireniz ${shortNpc} tarafından ${listingToBuy.price} ETH karşılığında satın alındı!`, 'success');
        } else {
          setBalance(b => b + listingToBuy.price);
          addNotification(lang === 'en' 
            ? `Your listed Apt ${listingToBuy.unit} was bought by ${shortNpc} for ${listingToBuy.price.toLocaleString('tr-TR')} $MRT!` 
            : `Satışta olan ${listingToBuy.unit} daireniz ${shortNpc} tarafından ${listingToBuy.price.toLocaleString('tr-TR')} $MRT karşılığında satın alındı!`, 'success');
        }
      }
    }, 20000);
    return () => clearInterval(interval);
  }, [marketListings, lang, addNotification]);

  // Wallet Connect simulated via RainbowKit design
  const handleOpenWalletConnect = useCallback(() => {
    if (wallet) {
      setWallet(null);
      addNotification(lang === 'en' ? 'Wallet disconnected' : 'Cüzdan bağlantısı kesildi', 'info');
    } else {
      setIsRainbowOpen(true);
    }
  }, [wallet, lang, addNotification]);

  const handleSelectWallet = useCallback((providerName) => {
    const addr = '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    setWallet({
      address: addr,
      shortAddress: addr.slice(0, 6) + '...' + addr.slice(-4),
      provider: providerName,
    });
    setIsRainbowOpen(false);
    addNotification(lang === 'en' ? `Connected to ${providerName}` : `${providerName} cüzdanı bağlandı`, 'success');
  }, [lang, addNotification]);

  // Helper to pay referral commissions (20% of purchases)
  const handlePayReferralCommission = useCallback((amount, currency) => {
    if (!referredBy) return;
    const commission = amount * 0.20;
    // In a real network, this 20% would be automatically deducted or routed to the referrer's address.
    // For local interactive simulation, we print the notification.
    addNotification(lang === 'en' 
      ? `20% Referral Commission (${commission.toFixed(3)} ${currency}) routed to ${referredBy.slice(0, 6)}...${referredBy.slice(-4)}` 
      : `%20 Referans Komisyonu (${commission.toFixed(3)} ${currency}) davet edenin cüzdanına (${referredBy.slice(0, 6)}...${referredBy.slice(-4)}) gönderildi!`, 'info');
  }, [referredBy, lang, addNotification]);

  const handleBuyApartment = useCallback((buildingIdx, aptId) => {
    setApartments(prev => {
      const arr = prev[buildingIdx];
      if (!arr) return prev;
      const apt = arr.find(a => a.id === aptId);
      if (!apt || apt.status !== 'available') return prev;
      if (balance < apt.price) {
        addNotification(t.insufficientBalance, 'error');
        return prev;
      }
      setBalance(b => b - apt.price);
      
      // Referral trigger
      handlePayReferralCommission(apt.price, '$MRT');

      addNotification(lang === 'en' ? `Purchased ${apt.unitEn || apt.unit}!` : `${apt.unit} başarıyla satın alındı!`, 'success');
      return { ...prev, [buildingIdx]: arr.map(a => a.id === aptId ? { ...a, status: 'owned' } : a) };
    });
  }, [balance, handlePayReferralCommission, lang, addNotification, t]);

  // Buy from P2P Marketplace
  const handleBuyMarketListing = useCallback((listing) => {
    const isEth = listing.currency === 'ETH';
    if (isEth) {
      if (ethBalance < listing.price) {
        addNotification(t.insufficientBalance, 'error');
        return;
      }
      setEthBalance(b => b - listing.price);
    } else {
      if (balance < listing.price) {
        addNotification(t.insufficientBalance, 'error');
        return;
      }
      setBalance(b => b - listing.price);
    }

    // Pay P2P referral fee
    handlePayReferralCommission(listing.price, isEth ? 'ETH' : '$MRT');

    // Update apartments status to owned for current player
    setApartments(prev => {
      const arr = prev[listing.buildingIndex];
      if (!arr) return prev;
      return {
        ...prev,
        [listing.buildingIndex]: arr.map(a => a.id === listing.aptId ? { ...a, status: 'owned', owner: undefined } : a)
      };
    });

    // Remove from marketplace listings
    setMarketListings(prev => prev.filter(l => l.id !== listing.id));

    addNotification(lang === 'en' 
      ? `Successfully purchased ${listing.unit} for ${listing.price.toLocaleString('tr-TR')} ${listing.currency || 'MRT'}!` 
      : `${listing.unit} mülkü ${listing.price.toLocaleString('tr-TR')} ${listing.currency || 'MRT'} karşılığında satın alındı!`, 'success');
  }, [balance, ethBalance, handlePayReferralCommission, lang, addNotification, t]);

  // Open inline P2P listing form
  const handleOpenListForm = useCallback((buildingIdx, aptId) => {
    setListingForm({ buildingIdx, aptId, price: '', currency: 'MRT' });
  }, []);

  const handleCancelListForm = useCallback(() => {
    setListingForm(null);
  }, []);

  // Confirm P2P listing custom price
  const handleConfirmList = useCallback(() => {
    if (!listingForm) return;
    const { buildingIdx, aptId, price, currency } = listingForm;
    const listingPrice = parseFloat(price);
    if (isNaN(listingPrice) || listingPrice <= 0) {
      addNotification(lang === 'en' ? 'Please enter a valid price.' : 'Lütfen geçerli bir fiyat girin.', 'error');
      return;
    }

    setApartments(prev => {
      const arr = prev[buildingIdx];
      if (!arr) return prev;
      const apt = arr.find(a => a.id === aptId);
      if (!apt || apt.status !== 'owned') return prev;

      // Add to marketplace listings state
      setMarketListings(prevListings => [
        ...prevListings,
        {
          id: `list-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          buildingIndex: buildingIdx,
          aptId: aptId,
          unit: apt.unit,
          unitEn: apt.unitEn,
          floor: apt.floor,
          seller: 'You',
          price: listingPrice,
          currency: currency,
          rentIncome: apt.rentIncome,
          annualCost: apt.annualCost
        }
      ]);

      // Set property state to listed
      return { ...prev, [buildingIdx]: arr.map(a => a.id === aptId ? { ...a, status: 'listed' } : a) };
    });

    setListingForm(null);
    addNotification(lang === 'en' 
      ? `Property listed on Marketplace for ${listingPrice.toLocaleString('tr-TR')} ${currency}!` 
      : `Mülk ${listingPrice.toLocaleString('tr-TR')} ${currency} karşılığında satış tahtasına eklendi!`, 'success');
  }, [listingForm, lang, addNotification]);

  // Cancel property marketplace listing
  const handleCancelListing = useCallback((buildingIdx, aptId) => {
    setMarketListings(prev => prev.filter(l => !(l.buildingIndex === buildingIdx && l.aptId === aptId)));
    setApartments(prev => {
      const arr = prev[buildingIdx];
      if (!arr) return prev;
      return { ...prev, [buildingIdx]: arr.map(a => a.id === aptId ? { ...a, status: 'owned' } : a) };
    });
    addNotification(lang === 'en' ? 'Listing cancelled. Apartment returned to inventory.' : 'İlan iptal edildi. Daire envanterinize iade edildi.', 'info');
  }, [lang, addNotification]);

  // Handle governance votes
  const handleCastVote = useCallback((proposalId, option) => {
    if (!wallet) {
      addNotification(t.walletRequired || 'Connect Wallet to vote', 'error');
      return;
    }

    const votePower = balance + (economyStats.yours * 10000);

    setProposals(prev => prev.map(p => {
      if (p.id !== proposalId) return p;
      if (p.userVote) return p; // Already voted

      let yesAdd = option === 'yes' ? votePower : 0;
      let noAdd = option === 'no' ? votePower : 0;
      let abstainAdd = option === 'abstain' ? votePower : 0;

      addNotification(lang === 'en' 
        ? `Cast ${votePower.toLocaleString()} votes for ${option.toUpperCase()}` 
        : `${votePower.toLocaleString()} oy ile ${option.toUpperCase()} yönünde oy kullanıldı!`, 'success');

      return {
        ...p,
        userVote: option,
        votesYes: p.votesYes + yesAdd,
        votesNo: p.votesNo + noAdd,
        votesAbstain: p.votesAbstain + abstainAdd
      };
    }));
  }, [wallet, balance, economyStats.yours, lang, addNotification, t]);

  // Copy referral link to clipboard
  const [isCopied, setIsCopied] = useState(false);
  const handleCopyLink = useCallback(() => {
    const userAddress = wallet ? wallet.address : '0xYourWalletAddress';
    const link = `${window.location.origin}/?ref=${userAddress}`;
    navigator.clipboard.writeText(link).then(() => {
      setIsCopied(true);
      addNotification(t.copied, 'success');
      setTimeout(() => setIsCopied(false), 2000);
    });
  }, [wallet, addNotification, t]);

  // Simulate Referral Spend Event
  const handleSimulateReferralSpend = useCallback(() => {
    if (referralsList.length === 0) return;
    const randomRef = referralsList[Math.floor(Math.random() * referralsList.length)];
    const isEth = Math.random() > 0.5;

    if (isEth) {
      const spend = parseFloat((Math.random() * 0.8 + 0.1).toFixed(2));
      const commission = parseFloat((spend * 0.20).toFixed(3));
      
      setEthBalance(b => b + commission);
      setReferralEarningsETH(e => parseFloat((e + commission).toFixed(3)));
      setReferralLogs(prev => [
        {
          id: Date.now(),
          address: randomRef.slice(0, 6) + '...' + randomRef.slice(-4),
          amount: `${spend} ETH`,
          commission: `${commission} ETH`,
          time: 'Just now'
        },
        ...prev
      ]);
      addNotification(lang === 'en' 
        ? `Referred user ${randomRef.slice(0,6)}... spent ${spend} ETH! You earned 20% commission (${commission} ETH)` 
        : `Davet ettiğiniz ${randomRef.slice(0,6)}... kullanıcısı ${spend} ETH harcadı! %20 Komisyon kazandınız (${commission} ETH)`, 'success');
    } else {
      const spend = Math.floor(Math.random() * 8000 + 2000);
      const commission = Math.floor(spend * 0.20);

      setBalance(b => b + commission);
      setReferralEarningsMRT(e => e + commission);
      setReferralLogs(prev => [
        {
          id: Date.now(),
          address: randomRef.slice(0, 6) + '...' + randomRef.slice(-4),
          amount: `${spend.toLocaleString('tr-TR')} $MRT`,
          commission: `${commission.toLocaleString('tr-TR')} $MRT`,
          time: 'Just now'
        },
        ...prev
      ]);
      addNotification(lang === 'en' 
        ? `Referred user ${randomRef.slice(0,6)}... spent ${spend.toLocaleString()} $MRT! You earned 20% commission (${commission.toLocaleString()} $MRT)` 
        : `Davet ettiğiniz ${randomRef.slice(0,6)}... kullanıcısı ${spend.toLocaleString()} $MRT harcadı! %20 Komisyon kazandınız (${commission.toLocaleString()} $MRT)`, 'success');
    }
  }, [referralsList, lang, addNotification]);

  // Register Guest Simulated Wallet Referrals
  const handleRegisterGuest = useCallback(() => {
    if (!simAddress || !/^0x[a-fA-F0-9]{40}$/.test(simAddress)) {
      addNotification(lang === 'en' ? 'Please enter a valid wallet address.' : 'Lütfen geçerli bir cüzdan adresi girin.', 'error');
      return;
    }
    if (referralsList.includes(simAddress)) {
      addNotification(lang === 'en' ? 'This address is already registered.' : 'Bu adres zaten davet listesinde.', 'error');
      return;
    }
    setReferralsList(prev => [...prev, simAddress]);
    setSimAddress('');
    addNotification(lang === 'en' ? 'New referred player registered successfully!' : 'Yeni davetli oyuncu başarıyla eklendi!', 'success');
  }, [simAddress, referralsList, lang, addNotification]);

  // Page level route opener (simulating full screen loading screen)
  const handleOpenPage = useCallback((pageName) => {
    if (!pageName) {
      setActiveModal(null);
      setTransitioningPage(null);
      return;
    }
    setIsLoadingPage(true);
    setTransitioningPage(pageName);
    setTimeout(() => {
      setActiveModal(pageName);
      setIsLoadingPage(false);
    }, 700);
  }, []);

  const handleBuildingClick = useCallback((building) => {
    setSelectedBuilding(building);
    if (building.cameraTarget) setCameraTarget(building.cameraTarget);
  }, []);

  const handleClosePanel = useCallback(() => { setSelectedBuilding(null); setCameraTarget(null); }, []);
  const handleResetCamera = useCallback(() => { setCameraTarget(null); if (controlsRef.current) controlsRef.current.reset(); }, []);
  const handleZoomIn = useCallback(() => { if (controlsRef.current) { controlsRef.current.object.position.multiplyScalar(0.8); controlsRef.current.update(); } }, []);
  const handleZoomOut = useCallback(() => { if (controlsRef.current) { controlsRef.current.object.position.multiplyScalar(1.2); controlsRef.current.update(); } }, []);

  useEffect(() => { [10, 25, 40, 55, 70, 85].forEach((v, i) => setTimeout(() => setLoadProgress(v), (i + 1) * 300)); }, []);
  const handleSceneReady = useCallback(() => { setLoadProgress(100); setTimeout(() => setIsLoaded(true), 600); }, []);

  const allOwned = Object.entries(apartments).flatMap(([idx, arr]) => arr.filter(a => a.status === 'owned' || a.status === 'listed').map(a => ({ ...a, buildingIdx: parseInt(idx) })));

  // Real-time returns calculation
  const dailyReturn = useMemo(() => Math.round(totalIncome * 0.1), [totalIncome]);
  const hourlyReturn = useMemo(() => Math.round(dailyReturn / 24), [dailyReturn]);
  const perSecondReturn = useMemo(() => (hourlyReturn / 3600).toFixed(4), [hourlyReturn]);

  return (
    <main style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <LoadingScreen progress={loadProgress} loaded={isLoaded} t={t} />

      <div className="canvas-container">
        <Canvas shadows camera={{ position: [25, 20, 25], fov: 50, near: 0.1, far: 500 }}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance', toneMapping: 3, toneMappingExposure: 1.0 }}
          onCreated={({ gl }) => { gl.setClearColor('#000000'); }}>
          <Suspense fallback={null}>
            <CityScene onBuildingClick={handleBuildingClick} selectedBuilding={selectedBuilding}
              controlsRef={controlsRef} onSceneReady={handleSceneReady} cameraTarget={cameraTarget} />
          </Suspense>
        </Canvas>
      </div>

      <HUD onResetCamera={handleResetCamera} onZoomIn={handleZoomIn} onZoomOut={handleZoomOut}
        balance={balance} ethBalance={ethBalance} totalIncome={totalIncome} totalCost={totalCost}
        ownedCount={economyStats.yours} onOpenModal={handleOpenPage}
        t={t} lang={lang} onToggleLang={() => setLang(l => l === 'tr' ? 'en' : 'tr')}
        wallet={wallet} onConnectWallet={handleOpenWalletConnect}
        economyStats={economyStats} appreciationRate={appreciationRate} />

      <BuildingPanel building={selectedBuilding} onClose={handleClosePanel}
        apartments={selectedBuilding ? (apartments[selectedBuilding.buildingIndex] || []) : []}
        onBuy={(aptId) => selectedBuilding && handleBuyApartment(selectedBuilding.buildingIndex, aptId)}
        balance={balance} t={t} lang={lang} />

      {/* Toast Notifications */}
      <div className="toast-container" style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '10px', pointerEvents: 'none' }}>
        {notifications.map(n => (
          <div key={n.id} className={`toast-notification glass ${n.type}`} style={{
            pointerEvents: 'auto',
            padding: '12px 20px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(10, 10, 10, 0.95)',
            border: `1px solid ${n.type === 'success' ? 'var(--green)' : n.type === 'error' ? 'var(--red)' : 'var(--glass-border)'}`,
            boxShadow: 'var(--glass-shadow)',
            color: 'var(--text-primary)',
            fontSize: '0.8rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            {n.type === 'success' && <span style={{ color: 'var(--green)' }}>✓</span>}
            {n.type === 'error' && <span style={{ color: 'var(--red)' }}>✕</span>}
            <span>{n.text}</span>
          </div>
        ))}
      </div>

      {/* Simulated RainbowKit Web3 Wallet Modal */}
      {isRainbowOpen && (
        <div className="rainbow-overlay" onClick={() => setIsRainbowOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="rainbow-container glass" onClick={e => e.stopPropagation()} style={{ width: '420px', maxHeight: '82vh', display: 'flex', flexDirection: 'column' }}>
            <div className="rainbow-header" style={{ display: 'flex', justify: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800 }}>Connect a Wallet</h3>
              <button className="rainbow-close" onClick={() => setIsRainbowOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
            </div>
            <div className="rainbow-body" style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="rainbow-wallet-option" onClick={() => handleSelectWallet('MetaMask')} style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all var(--t-fast)' }}>
                <svg viewBox="0 0 32 32" width="28" height="28" style={{ marginRight: '12px' }}>
                  <path d="M28.3 8.3L16 2 3.7 8.3l-.7 13.8L16 30l13-7.9-.7-13.8z" fill="#E2761B"/>
                  <path d="M16 16.5l-7.7-1.1L5 19.3l11 6.5 11-6.5-3.3-3.9L16 16.5z" fill="#E4761B"/>
                  <path d="M28.3 8.3l-4.7 7.1 4.4 3.9.6-11z" fill="#D7C1B1"/>
                  <path d="M3.7 8.3l4.7 7.1-4.4 3.9-.6-11z" fill="#D7C1B1"/>
                  <path d="M16 2l3.4 9.1h-6.8L16 2z" fill="#F6851B"/>
                </svg>
                <span style={{ fontWeight: 600 }}>MetaMask</span>
                <span className="badge" style={{ marginLeft: 'auto', padding: '3px 8px', borderRadius: '10px', background: 'rgba(255,255,255,0.08)', fontSize: '0.6rem', fontWeight: 700, color: 'var(--orange)' }}>Popular</span>
              </div>
              <div className="rainbow-wallet-option" onClick={() => handleSelectWallet('Rainbow')} style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all var(--t-fast)' }}>
                <svg viewBox="0 0 32 32" width="28" height="28" style={{ marginRight: '12px' }}>
                  <defs>
                    <linearGradient id="rainbowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ff0055" />
                      <stop offset="50%" stopColor="#00ffcc" />
                      <stop offset="100%" stopColor="#9900ff" />
                    </linearGradient>
                  </defs>
                  <circle cx="16" cy="16" r="14" fill="url(#rainbowGrad)" />
                  <path d="M16 9a7 7 0 0 1 7 7H9a7 7 0 0 1 7-7z" fill="#fff" />
                </svg>
                <span style={{ fontWeight: 600 }}>Rainbow</span>
              </div>
              <div className="rainbow-wallet-option" onClick={() => handleSelectWallet('Coinbase')} style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all var(--t-fast)' }}>
                <svg viewBox="0 0 32 32" width="28" height="28" style={{ marginRight: '12px' }}>
                  <rect x="2" y="2" width="28" height="28" rx="8" fill="#0052FF" />
                  <rect x="10" y="10" width="12" height="12" rx="3" fill="#FFF" />
                </svg>
                <span style={{ fontWeight: 600 }}>Coinbase Wallet</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PREMIUM FULL-SCREEN PAGES CONTAINER */}
      {transitioningPage && (
        <div className="dashboard-overlay">
          {/* Top Level Custom Page Loader Animation */}
          {isLoadingPage && (
            <div className="dashboard-loader">
              <div className="spinner-glow" />
              <span className="loader-text">
                {transitioningPage === 'marketplace' && (lang === 'en' ? 'Accessing P2P Trading Floor...' : 'P2P Ticaret Tahtasına Bağlanılıyor...')}
                {transitioningPage === 'inventory' && (lang === 'en' ? 'Retrieving Asset Portfolios...' : 'Varlık Portföyü Yükleniyor...')}
                {transitioningPage === 'profile' && (lang === 'en' ? 'Syncing Investor Registry...' : 'Yatırımcı Kayıtları Eşleniyor...')}
                {transitioningPage === 'vote' && (lang === 'en' ? 'Connecting Governance Oracle...' : 'Yönetişim Oracle Bağlantısı...')}
                {transitioningPage === 'referrals' && (lang === 'en' ? 'Verifying Referral Ledger...' : 'Referans Defteri Doğrulanıyor...')}
              </span>
            </div>
          )}

          {/* PAGE CONTENT */}
          {!isLoadingPage && activeModal && (
            <>
              {/* Header */}
              <div className="dashboard-header">
                <div className="dashboard-title-area">
                  <h1>
                    {activeModal === 'marketplace' && t.marketplace.toUpperCase()}
                    {activeModal === 'inventory' && t.inventory.toUpperCase()}
                    {activeModal === 'profile' && t.profile.toUpperCase()}
                    {activeModal === 'vote' && t.vote.toUpperCase()}
                    {activeModal === 'referrals' && t.referrals.toUpperCase()}
                  </h1>
                  <p>
                    {activeModal === 'marketplace' && t.marketplaceDesc}
                    {activeModal === 'inventory' && t.inventoryDesc}
                    {activeModal === 'profile' && (lang === 'en' ? 'Web3 Real Estate portfolio yield breakdown & metrics.' : 'Web3 Emlak portföy getiri dökümü ve yatırımcı metrikleri.')}
                    {activeModal === 'vote' && (lang === 'en' ? 'Monaco Estate Governance Council. Vote on pending network proposals.' : 'Monaco Estate Yönetim Kurulu. Aktif ağ tekliflerini oylayın.')}
                    {activeModal === 'referrals' && t.referralsDesc}
                  </p>
                </div>
                <button className="dashboard-close-btn" onClick={() => handleOpenPage(null)}>
                  <ArrowLeftIcon />
                  <span>{t.backToMap}</span>
                </button>
              </div>

              {/* Body */}
              <div className="dashboard-body">
                
                {/* 1. MARKETPLACE PAGE */}
                {activeModal === 'marketplace' && (
                  <div className="dashboard-grid">
                    {/* Left Column (Market Stats & Appreciation Rate) */}
                    <div className="db-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div className="db-card-title">
                        <TrendingUpIcon size={18} />
                        <span>Market Activity</span>
                      </div>
                      
                      <div className="economy-bar" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'transparent', padding: 0, border: 'none' }}>
                        <div className="ref-stat-card"><span className="ref-stat-num">{economyStats.total}</span><span className="ref-stat-lbl">{t.totalUnits}</span></div>
                        <div className="ref-stat-card"><span className="ref-stat-num" style={{ color: 'var(--red)' }}>{economyStats.sold}</span><span className="ref-stat-lbl">{t.soldUnits}</span></div>
                        <div className="ref-stat-card"><span className="ref-stat-num" style={{ color: 'var(--green)' }}>{economyStats.available}</span><span className="ref-stat-lbl">{t.availableUnits}</span></div>
                        <div className="ref-stat-card"><span className="ref-stat-num" style={{ color: 'var(--orange)' }}>{economyStats.yours}</span><span className="ref-stat-lbl">{t.yourUnits}</span></div>
                      </div>

                      <div className="market-appreciation-banner" style={{ margin: 0, padding: '16px', background: 'rgba(34, 197, 94, 0.04)', borderRadius: 'var(--radius-md)' }}>
                        <TrendingUpIcon size={18} style={{ color: 'var(--green)' }} />
                        <span style={{ fontSize: '0.85rem' }}>Monaco Yield Appreciation: <strong style={{ color: 'var(--green)' }}>+{appreciationRate}%</strong>/yr</span>
                      </div>

                      <div className="wallet-warning-card" style={{ padding: '24px', borderStyle: 'solid', marginTop: 0 }}>
                        <h4 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.95rem', fontWeight: 700, marginBottom: '6px' }}>Dual-Currency Supported</h4>
                        <p style={{ fontSize: '0.78rem', margin: 0, color: 'var(--text-muted)' }}>Apartments on the P2P Marketplace can be listed and purchased using either <strong>$MRT</strong> or <strong>ETH</strong>. Select your currency filters directly inside the marketplace cards.</p>
                      </div>
                    </div>

                    {/* Right Column (Listings Board) */}
                    <div className="marketplace-grid">
                      {marketListings.map(listing => {
                        const isEth = listing.currency === 'ETH';
                        return (
                          <div key={listing.id} className="marketplace-listing-card">
                            <div className="ml-header">
                              <div>
                                <span className="ml-title">{lang === 'en' ? listing.unitEn || listing.unit : listing.unit}</span>
                                <div className="ml-sub">Monaco Sector · {t.floor} {listing.floor}</div>
                              </div>
                              {listing.seller === 'You' ? (
                                <span className="ml-listed-badge">Listed</span>
                              ) : (
                                <span className="prop-badge active" style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>P2P</span>
                              )}
                            </div>

                            <div className="ml-stats-row">
                              <div className="ml-stat">
                                <span className="ml-stat-val income">+{listing.rentIncome} $MRT</span>
                                <span className="ml-stat-lbl">{t.rent}</span>
                              </div>
                              <div className="ml-stat">
                                <span className="ml-stat-val expense">−{listing.annualCost} $MRT</span>
                                <span className="ml-stat-lbl">{t.expense}</span>
                              </div>
                            </div>

                            <div className="ml-footer">
                              <div className={`ml-price ${isEth ? 'eth' : 'mrt'}`}>
                                {isEth ? listing.price.toFixed(3) : listing.price.toLocaleString('tr-TR')}
                                <small>{isEth ? 'ETH' : '$MRT'}</small>
                              </div>
                              {listing.seller !== 'You' && (
                                <button 
                                  className={`ml-buy-btn ${(isEth ? ethBalance < listing.price : balance < listing.price) ? 'disabled' : ''}`}
                                  onClick={() => handleBuyMarketListing(listing)}
                                  disabled={isEth ? ethBalance < listing.price : balance < listing.price}
                                >
                                  {(isEth ? ethBalance < listing.price : balance < listing.price) ? (lang === 'en' ? 'No Funds' : 'Yetersiz') : t.buy}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. INVENTORY PAGE */}
                {activeModal === 'inventory' && (
                  <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr' }}>
                    
                    {/* Header statistics bar */}
                    <div className="inventory-summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '24px', borderRadius: 'var(--radius-lg)' }}>
                      <div style={{ textAlign: 'center' }}><span style={{ display: 'block', fontSize: '2rem', fontFamily: "'Outfit',sans-serif", fontWeight: 800 }}>{economyStats.yours}</span><span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t.totalProperties}</span></div>
                      <div style={{ textAlign: 'center' }}><span style={{ display: 'block', fontSize: '2rem', fontFamily: "'Outfit',sans-serif", fontWeight: 800, color: 'var(--green)' }}>+{totalIncome} $MRT</span><span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t.monthlyIncome}</span></div>
                      <div style={{ textAlign: 'center' }}><span style={{ display: 'block', fontSize: '2rem', fontFamily: "'Outfit',sans-serif", fontWeight: 800, color: 'var(--red)' }}>−{totalCost} $MRT</span><span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t.yearlyExpense}</span></div>
                      <div style={{ textAlign: 'center' }}><span style={{ display: 'block', fontSize: '2rem', fontFamily: "'Outfit',sans-serif", fontWeight: 800, color: 'var(--orange)' }}>+{appreciationRate}%</span><span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{lang === 'en' ? 'Average Appreciation' : 'Ortalama Değer Artışı'}</span></div>
                    </div>

                    {allOwned.length === 0 ? (
                      <div className="wallet-warning-card" style={{ padding: '60px 40px' }}>
                        <h3>{lang === 'en' ? 'Your Portfolio is Empty' : 'Portföyünüz Boş'}</h3>
                        <p>{t.noProperties}</p>
                      </div>
                    ) : (
                      <div className="marketplace-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                        {allOwned.map(apt => (
                          <div key={apt.id} className="marketplace-listing-card" style={{ background: apt.status === 'listed' ? 'rgba(245, 158, 11, 0.02)' : 'rgba(255,255,255,0.02)', borderColor: apt.status === 'listed' ? 'rgba(245,158,11,0.25)' : 'var(--border-color)' }}>
                            <div className="ml-header">
                              <div>
                                <span className="ml-title">{lang === 'en' ? apt.unitEn || apt.unit : apt.unit}</span>
                                <div className="ml-sub">Monaco luxury asset · {t.floor} {apt.floor}</div>
                              </div>
                              {apt.status === 'listed' ? (
                                <span className="prop-badge voted">Listed</span>
                              ) : (
                                <span className="prop-badge active">Owned</span>
                              )}
                            </div>

                            <div className="ml-stats-row">
                              <div className="ml-stat">
                                <span className="ml-stat-val income">+{apt.rentIncome} $MRT</span>
                                <span className="ml-stat-lbl">Rental Yield</span>
                              </div>
                              <div className="ml-stat">
                                <span className="ml-stat-val expense">−{apt.annualCost} $MRT</span>
                                <span className="ml-stat-lbl">Maintenance</span>
                              </div>
                            </div>

                            <div className="ml-footer" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '10px', display: 'flex' }}>
                              {apt.status === 'listed' ? (
                                <>
                                  {/* Find listing details */}
                                  {(() => {
                                    const listing = marketListings.find(l => l.aptId === apt.id);
                                    if (!listing) return null;
                                    return (
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Listed price:</span>
                                        <strong style={{ fontFamily: "'Outfit',sans-serif", color: listing.currency === 'ETH' ? 'var(--orange)' : 'var(--text-primary)' }}>
                                          {listing.currency === 'ETH' ? `${listing.price} ETH` : `${listing.price.toLocaleString('tr-TR')} $MRT`}
                                        </strong>
                                      </div>
                                    );
                                  })()}
                                  <button className="simulate-btn" onClick={() => handleCancelListing(apt.buildingIdx, apt.id)} style={{ borderColor: 'rgba(239, 68, 68, 0.25)', color: 'var(--red)', background: 'rgba(239, 68, 68, 0.04)' }}>
                                    {lang === 'en' ? 'Cancel Listing' : 'İlanı İptal Et'}
                                  </button>
                                </>
                              ) : (
                                <>
                                  {listingForm?.aptId === apt.id ? (
                                    <div className="p2p-sell-box" style={{ width: '100%', margin: 0, padding: '12px' }}>
                                      <div className="p2p-form-title">{t.listTitle}</div>
                                      <div className="p2p-form-row">
                                        <input 
                                          type="number" 
                                          className="p2 price-input" 
                                          placeholder={lang === 'en' ? 'Price' : 'Fiyat'}
                                          value={listingForm.price} 
                                          onChange={e => setListingForm(prev => ({ ...prev, price: e.target.value }))}
                                          style={{
                                            background: 'rgba(0,0,0,0.5)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: 'var(--radius-sm)',
                                            padding: '10px 14px',
                                            color: 'var(--text-primary)',
                                            fontFamily: 'monospace',
                                            fontSize: '0.9rem',
                                            outline: 'none'
                                          }}
                                        />
                                        <select 
                                          className="p2p-currency-select"
                                          value={listingForm.currency}
                                          onChange={e => setListingForm(prev => ({ ...prev, currency: e.target.value }))}
                                        >
                                          <option value="MRT">MRT</option>
                                          <option value="ETH">ETH</option>
                                        </select>
                                      </div>
                                      <div className="p2p-buttons-row">
                                        <button className="p2p-confirm-btn" onClick={handleConfirmList}>List</button>
                                        <button className="p2p-cancel-btn" onClick={handleCancelListForm}>✕</button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button className="ml-buy-btn" onClick={() => handleOpenListForm(apt.buildingIdx, apt.id)} style={{ width: '100%' }}>
                                      {t.sell}
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. PROFILE PAGE */}
                {activeModal === 'profile' && (
                  <div className="dashboard-grid-equal">
                    {/* Left Column: Investor Wallet & Balances */}
                    <div className="db-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      <div className="db-card-title">
                        <SparkleIcon />
                        <span>Investor Ledger</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--green), var(--orange))', display: 'flex', alignItems: 'center', justify: 'center', fontSize: '1.2rem', fontWeight: 800, color: '#000' }}>
                          M
                        </div>
                        <div>
                          <h4 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1rem', fontWeight: 700 }}>Monaco Landlord Registry</h4>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Status: Active Account</span>
                        </div>
                      </div>

                      {wallet ? (
                        <div style={{ padding: '16px', background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Connected via {wallet.provider}</span>
                          <code style={{ fontSize: '0.78rem', color: 'var(--text-primary)', wordBreak: 'break-all' }}>{wallet.address}</code>
                          <button onClick={handleOpenWalletConnect} style={{ width: 'fit-content', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, textDecoration: 'underline', marginTop: '6px', padding: 0 }}>Disconnect Wallet</button>
                        </div>
                      ) : (
                        <div style={{ padding: '24px', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '14px' }}>No Web3 wallet connected. Connect your wallet to access high-yield governance mechanisms.</p>
                          <button className="simulate-btn" onClick={handleOpenWalletConnect} style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)', border: 'none' }}>Connect Wallet</button>
                        </div>
                      )}

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                        <div className="ref-stat-card" style={{ padding: '20px' }}>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>$MRT BALANCE</span>
                          <span className="ref-stat-num" style={{ display: 'block', marginTop: '8px' }}>{balance.toLocaleString('tr-TR')}</span>
                        </div>
                        <div className="ref-stat-card" style={{ padding: '20px' }}>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ETH BALANCE</span>
                          <span className="ref-stat-num eth" style={{ display: 'block', marginTop: '8px' }}>{ethBalance.toFixed(3)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Return breakdown and Logs */}
                    <div className="db-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      <div className="db-card-title">
                        <FlashIcon size={18} />
                        <span>Live Returns Breakdown</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t.realtimeReturn}:</span>
                          <strong style={{ color: 'var(--green)' }}>+{perSecondReturn} $MRT/sec</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t.hourlyReturn}:</span>
                          <strong style={{ color: 'var(--green)' }}>+{hourlyReturn} $MRT/hr</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t.dailyReturn}:</span>
                          <strong style={{ color: 'var(--green)' }}>+{dailyReturn} $MRT/day</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t.monthlyIncome}:</span>
                          <strong style={{ color: 'var(--green)' }}>+{totalIncome} $MRT/month</strong>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Passive Portfolio Value</span>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: "'Outfit',sans-serif" }}>{(allOwned.reduce((sum, current) => sum + current.price, 0)).toLocaleString('tr-TR')} $MRT</span>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Estimated Book Value</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. GOVERNANCE VOTE PAGE */}
                {activeModal === 'vote' && (
                  <div className="dashboard-grid">
                    {/* Left Column (Voting Power description) */}
                    <div className="db-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div className="db-card-title">
                        <VoteCheckIcon />
                        <span>{t.votePower}</span>
                      </div>

                      <div className="ref-stat-card" style={{ padding: '24px', background: 'rgba(255,255,255,0.01)' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>YOUR VOTING WEIGHT</span>
                        <span style={{ display: 'block', fontSize: '2.5rem', fontFamily: "'Outfit',sans-serif", fontWeight: 800, color: 'var(--green)', marginTop: '8px' }}>
                          {(balance + (economyStats.yours * 10000)).toLocaleString()}
                        </span>
                        <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>Votes Power</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        <p>Your voting power inside the Mortgage Governance Oracle is determined by your holdings: </p>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                          • <strong>1 $MRT</strong> = 1 Voting Point <br />
                          • <strong>1 Luxury Apartment</strong> = 10,000 Voting Points
                        </div>
                      </div>

                      {!wallet && (
                        <div className="wallet-warning-card" style={{ padding: '20px', borderStyle: 'solid', marginTop: 0 }}>
                          <h4 style={{ fontSize: '0.9rem', marginBottom: '4px' }}>Wallet Disconnected</h4>
                          <p style={{ fontSize: '0.75rem', margin: 0 }}>Please connect your wallet in order to push votes on Proposals to the blockchain ledger.</p>
                        </div>
                      )}
                    </div>

                    {/* Right Column (Proposals List) */}
                    <div className="proposals-list">
                      {proposals.map(prop => {
                        const totalVotes = prop.votesYes + prop.votesNo + prop.votesAbstain;
                        const pctYes = totalVotes > 0 ? ((prop.votesYes / totalVotes) * 100).toFixed(1) : '0.0';
                        const pctNo = totalVotes > 0 ? ((prop.votesNo / totalVotes) * 100).toFixed(1) : '0.0';
                        const pctAbstain = totalVotes > 0 ? ((prop.votesAbstain / totalVotes) * 100).toFixed(1) : '0.0';

                        return (
                          <div key={prop.id} className="prop-card">
                            <div className="prop-badge-row">
                              <span className="prop-badge active">Active Proposal</span>
                              {prop.userVote && (
                                <span className="prop-badge voted">Voted {prop.userVote.toUpperCase()}</span>
                              )}
                            </div>

                            <h3>{lang === 'en' ? prop.title : prop.titleTr || prop.title}</h3>
                            <p className="prop-desc">{lang === 'en' ? prop.description : prop.descriptionTr || prop.description}</p>

                            <div className="prop-results-grid">
                              <div className="prop-result-row">
                                <div className="prop-result-info">
                                  <span>YES</span>
                                  <span>{pctYes}% ({prop.votesYes.toLocaleString()} votes)</span>
                                </div>
                                <div className="prop-progress-bar">
                                  <div className="prop-progress-fill yes" style={{ width: `${pctYes}%` }} />
                                </div>
                              </div>
                              <div className="prop-result-row">
                                <div className="prop-result-info">
                                  <span>NO</span>
                                  <span>{pctNo}% ({prop.votesNo.toLocaleString()} votes)</span>
                                </div>
                                <div className="prop-progress-bar">
                                  <div className="prop-progress-fill no" style={{ width: `${pctNo}%` }} />
                                </div>
                              </div>
                              <div className="prop-result-row">
                                <div className="prop-result-info">
                                  <span>ABSTAIN</span>
                                  <span>{pctAbstain}% ({prop.votesAbstain.toLocaleString()} votes)</span>
                                </div>
                                <div className="prop-progress-bar">
                                  <div className="prop-progress-fill abstain" style={{ width: `${pctAbstain}%` }} />
                                </div>
                              </div>
                            </div>

                            {wallet ? (
                              <div className="prop-vote-actions">
                                <button 
                                  className={`prop-vote-btn ${prop.userVote === 'yes' ? 'selected' : ''}`}
                                  disabled={!!prop.userVote}
                                  onClick={() => handleCastVote(prop.id, 'yes')}
                                >
                                  YES
                                </button>
                                <button 
                                  className={`prop-vote-btn ${prop.userVote === 'no' ? 'selected' : ''}`}
                                  disabled={!!prop.userVote}
                                  onClick={() => handleCastVote(prop.id, 'no')}
                                >
                                  NO
                                </button>
                                <button 
                                  className={`prop-vote-btn ${prop.userVote === 'abstain' ? 'selected' : ''}`}
                                  disabled={!!prop.userVote}
                                  onClick={() => handleCastVote(prop.id, 'abstain')}
                                >
                                  ABSTAIN
                                </button>
                              </div>
                            ) : (
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                                Connect your Web3 wallet to access voting options.
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 5. REFERRALS PAGE */}
                {activeModal === 'referrals' && (
                  <div className="dashboard-grid">
                    {/* Left Column (Referrals Copy & Simulation) */}
                    <div className="db-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      <div className="db-card-title">
                        <CopyIcon />
                        <span>{t.referralLink}</span>
                      </div>

                      <div className="referral-link-container">
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Share your registration code with colleagues. You will secure 20% commission on all of their real-estate platform transactions.</span>
                        <div className="ref-input-group">
                          <input 
                            type="text" 
                            readOnly 
                            className="ref-input" 
                            value={`${window.location.origin}/?ref=${wallet ? wallet.address : '0xYourWalletAddress'}`} 
                          />
                          <button 
                            className={`ref-copy-btn ${isCopied ? 'copied' : ''}`} 
                            onClick={handleCopyLink}
                          >
                            {isCopied ? t.copied : t.copyLink}
                          </button>
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                        <span style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '12px' }}>Referral Simulation (Developer Tools)</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Input a simulated player wallet address to add as referral:</span>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input 
                              type="text" 
                              className="ref-input" 
                              style={{ padding: '10px 14px' }}
                              placeholder="0x..." 
                              value={simAddress}
                              onChange={e => setSimAddress(e.target.value)}
                            />
                            <button className="ref-copy-btn" onClick={handleRegisterGuest} style={{ background: 'var(--text-secondary)', padding: '0 16px' }}>Add</button>
                          </div>
                          
                          <button className="simulate-btn" onClick={handleSimulateReferralSpend}>
                            <SparkleIcon />
                            <span style={{ marginLeft: '6px' }}>{t.simulateReferralSpend}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Right Column (Invited Accounts & Revenue log) */}
                    <div className="db-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      <div className="db-card-title">
                        <FlashIcon size={18} />
                        <span>Earnings Dashboard</span>
                      </div>

                      <div className="ref-stats-row">
                        <div className="ref-stat-card">
                          <span className="ref-stat-num mrt">{referralsList.length}</span>
                          <span className="ref-stat-lbl">{t.totalReferrals}</span>
                        </div>
                        <div className="ref-stat-card">
                          <span className="ref-stat-num mrt" style={{ color: 'var(--green)' }}>{referralEarningsMRT.toLocaleString()}</span>
                          <span className="ref-stat-lbl">MRT COMMISSIONS</span>
                        </div>
                        <div className="ref-stat-card">
                          <span className="ref-stat-num eth">{referralEarningsETH.toFixed(3)}</span>
                          <span className="ref-stat-lbl">ETH COMMISSIONS</span>
                        </div>
                      </div>

                      <div>
                        <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '12px' }}>{t.referralActivity}</span>
                        <div className="ref-logs-list">
                          {referralLogs.map(log => (
                            <div key={log.id} className="ref-log-item">
                              <span className="ref-log-address">User {log.address}</span>
                              <span style={{ color: 'var(--text-muted)' }}>spent {log.amount}</span>
                              <span className="ref-log-value">+{log.commission}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
}
