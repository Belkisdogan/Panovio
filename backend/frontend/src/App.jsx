import React, { useState, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  Plus,
  Trash2,
  Search,
  Filter,
  X,
  Edit2,
  Save,
  CheckSquare,
  Square,
  FolderPlus,
  Layout,
  LogOut,
  User,
  Lock,
  Mail,
  Tag,
  MessageSquare,
  Send,
  History,
  Moon,
  Sun,
  Eye,
  EyeOff,
  Sparkles,
  Kanban,
  RotateCcw,
  Calendar,
  KeyRound,
  CheckCircle2,
  UserCheck,
  MessageCircle,
  ArrowLeft,
  Pipette,
  TrendingUp,
  Users,
  AlertTriangle,
  UserPlus,
  BarChart3,
  Check,
  Copy,
  Clock,
  ShieldCheck,
  Code2,
  Crown,
  MessageSquareText,
  MoreVertical,
  Paperclip,
  FileText,
  Download
} from 'lucide-react';
import './App.css';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function PanovioLogoBadge({ size = 48, showText = true }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '14px', userSelect: 'none' }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0, filter: 'drop-shadow(0 6px 14px rgba(37, 99, 235, 0.4))' }}
      >
        <defs>
          <linearGradient id="pvBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <linearGradient id="pvCardLeft" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>
          <linearGradient id="pvCardMid" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
          <linearGradient id="pvCardRight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <linearGradient id="pvWave" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#9333ea" />
          </linearGradient>
        </defs>

        <rect width="100" height="100" rx="26" fill="url(#pvBg)" />
        <rect x="2" y="2" width="96" height="96" rx="24" fill="#0b1329" fillOpacity="0.45" />

        <g transform="rotate(-6 28 52)">
          <rect x="18" y="26" width="18" height="48" rx="5" fill="url(#pvCardLeft)" />
          <rect x="22" y="38" width="10" height="3.5" rx="1.75" fill="#94a3b8" />
          <rect x="22" y="46" width="10" height="3.5" rx="1.75" fill="#94a3b8" />
        </g>

        <g transform="rotate(3 50 48)">
          <rect x="41" y="20" width="20" height="54" rx="5.5" fill="url(#pvCardMid)" />
          <circle cx="48" cy="34" r="2.5" fill="#ffffff" fillOpacity="0.9" />
          <circle cx="55" cy="34" r="2.5" fill="#ffffff" fillOpacity="0.9" />
        </g>

        <g transform="rotate(8 72 48)">
          <rect x="63" y="22" width="19" height="50" rx="5" fill="url(#pvCardRight)" />
          <rect x="67" y="34" width="11" height="5" rx="2.5" fill="#ffffff" fillOpacity="0.85" />
        </g>

        <path d="M55 100 C70 80, 85 75, 100 82 L100 100 Z" fill="url(#pvWave)" />
      </svg>

      {showText && (
        <span
          style={{
            fontSize: size * 0.74,
            fontWeight: 900,
            letterSpacing: '-0.5px',
            fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            display: 'inline-flex',
            alignItems: 'baseline',
            lineHeight: 1.2
          }}
        >
          <span style={{ color: 'var(--text-main, #ffffff)' }}>Pano</span>
          <span 
            style={{ 
              background: 'linear-gradient(135deg, #38bdf8 0%, #60a5fa 40%, #c084fc 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'inline-block',
              paddingBottom: '4px',
              marginLeft: '1px'
            }}
          >
            vio
          </span>
        </span>
      )}
    </div>
  );
}

const LABEL_COLORS = [
  '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
];

const BOARD_THEMES = [
  { name: 'Gece Mavisi', bg: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' },
  { name: 'Okyanus Dalgası', bg: 'linear-gradient(135deg, #0284c7 0%, #0f172a 100%)' },
  { name: 'Mor Gece', bg: 'linear-gradient(135deg, #7c3aed 0%, #1e1b4b 100%)' },
  { name: 'Gün Batımı', bg: 'linear-gradient(135deg, #f97316 0%, #7c2d12 100%)' },
  { name: 'Zümrüt Ormanı', bg: 'linear-gradient(135deg, #059669 0%, #064e3b 100%)' },
  { name: 'Lavanta Rüyası', bg: 'linear-gradient(135deg, #8b5cf6 0%, #4c1d95 100%)' },
  { name: 'Gül Pembesi', bg: 'linear-gradient(135deg, #ec4899 0%, #831843 100%)' },
  { name: 'Kuzey Işıkları', bg: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)' },
  { name: 'Derin Koyu', bg: '#0b1329' },
  { name: 'Grafit Kömür', bg: '#18181b' }
];

function App() {
  const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark');

  const [userCustomBg, setUserCustomBg] = useState(
    localStorage.getItem('app_board_bg') || 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
  );

  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const handleSetGlobalBackground = (bg) => {
    setUserCustomBg(bg);
    localStorage.setItem('app_board_bg', bg);
    showToast('Çalışma alanı rengi sabitlendi!');
  };

  const [toasts, setToasts] = useState([]);
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passError, setPassError] = useState('');
  const [registerSuccessMsg, setRegisterSuccessMsg] = useState('');

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCodeDigits, setForgotCodeDigits] = useState(['', '', '', '', '', '']);
  const pinInputRefs = useRef([]);
  const [forgotNewPass, setForgotNewPass] = useState('');
  const [forgotConfirmPass, setForgotConfirmPass] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotErr, setForgotErr] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);

  const [codeTimer, setCodeTimer] = useState(180);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let interval = null;
    if (showForgotModal && forgotStep === 2 && codeTimer > 0) {
      interval = setInterval(() => setCodeTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [showForgotModal, forgotStep, codeTimer]);

  useEffect(() => {
    let interval = null;
    if (resendCooldown > 0) {
      interval = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s} sn`;
  };

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [profileView, setProfileView] = useState('menu');
  const [profileName, setProfileName] = useState('');
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');
  const [myTasksList, setMyTasksList] = useState([]);
  const menuRef = useRef(null);

  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [columns, setColumns] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectError, setNewProjectError] = useState('');
  const [showAddProject, setShowAddProject] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [newColumnColor, setNewColumnColor] = useState('#f59e0b');
  const [showAddColumn, setShowAddColumn] = useState(false);

  const [isEditingProjectTitle, setIsEditingProjectTitle] = useState(false);
  const [projectTitleInput, setProjectTitleInput] = useState('');

  const [editingColId, setEditingColId] = useState(null);
  const [editingColTitle, setEditingColTitle] = useState('');

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('DEVELOPER');
  const [projectMembers, setProjectMembers] = useState([]);

  const [showStatsModal, setShowStatsModal] = useState(false);

  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [createTaskColId, setCreateTaskColId] = useState('');
  const [createTitle, setCreateTitle] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createPriority, setCreatePriority] = useState('medium');
  const [createStartDate, setCreateStartDate] = useState('');
  const [createDueDate, setCreateDueDate] = useState('');
  const [createAssignedToId, setCreateAssignedToId] = useState('');
  const [createAttachments, setCreateAttachments] = useState([]);
  const createAttachmentInputRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterDueDate, setFilterDueDate] = useState('all');
  const [selectedTagFilter, setSelectedTagFilter] = useState('all');
  const [onlyMyTasks, setOnlyMyTasks] = useState(false);

  // Filtreler Popover Kontrolü
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const filtersRef = useRef(null);

  // Üç Nokta Pano Menü Kontrolü
  const [isBoardMenuOpen, setIsBoardMenuOpen] = useState(false);
  const boardMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filtersRef.current && !filtersRef.current.contains(e.target)) {
        setIsFiltersOpen(false);
      }
      if (boardMenuRef.current && !boardMenuRef.current.contains(e.target)) {
        setIsBoardMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [activeTask, setActiveTask] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPriority, setEditPriority] = useState('medium');
  const [editStartDate, setEditStartDate] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editColumnId, setEditColumnId] = useState('');
  const [editAssignedToId, setEditAssignedToId] = useState('');
  const [newChecklistText, setNewChecklistText] = useState('');
  const [newLabelText, setNewLabelText] = useState('');
  const [selectedLabelColor, setSelectedLabelColor] = useState(LABEL_COLORS[3]);
  const [newCommentText, setNewCommentText] = useState('');
  const [editAttachments, setEditAttachments] = useState([]);
  const editAttachmentInputRef = useRef(null);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [allUsersList, setAllUsersList] = useState([]);
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [directMessages, setDirectMessages] = useState([]);
  const [dmInputText, setDmInputText] = useState('');
  const [chatSearchUser, setChatSearchUser] = useState('');
  const [unreadMessageCounts, setUnreadMessageCounts] = useState({});
  const chatEndRef = useRef(null);
  const chatDockRef = useRef(null);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  const currentProject = projects.find((p) => p.id === activeProjectId);
  const isManagerOfCurrentProject = currentProject?.currentUserRole === 'MANAGER';
  const totalUnreadMessages = Object.values(unreadMessageCounts).reduce(
    (sum, count) => sum + Number(count || 0),
    0
  );


  // Hesap veya sohbet değiştiğinde başka hesaptan kalan taslak mesajı temizle.
  useEffect(() => {
    setDmInputText('');
  }, [currentUser?.id, selectedChatUser?.id]);

  useEffect(() => {
    const handleClickOutsideMenu = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutsideMenu);
    return () => document.removeEventListener('mousedown', handleClickOutsideMenu);
  }, []);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setEmailError('');
    setPassError('');
    setRegisterSuccessMsg('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(authEmail.trim())) {
      setEmailError('Lütfen geçerli bir e-posta adresi girin.');
      return;
    }

    if (!isLoginMode) {
      if (authPassword.length < 8) {
        setPassError('Şifreniz en az 8 karakter olmalıdır.');
        return;
      }
      if (authPassword !== authConfirmPassword) {
        setPassError('Şifreler birbiriyle eşleşmiyor.');
        return;
      }
    }

    setAuthLoading(true);
    const endpoint = isLoginMode ? '/auth/login' : '/auth/register';
    const payload = isLoginMode
      ? { email: authEmail.trim(), password: authPassword }
      : { name: authName.trim(), email: authEmail.trim(), password: authPassword };

    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        setAuthError(data.error || 'İşlem başarısız.');
        setAuthLoading(false);
        return;
      }

      if (!isLoginMode) {
        setRegisterSuccessMsg('Hesabınız başarıyla oluşturuldu! Şimdi giriş yapabilirsiniz.');
        setIsLoginMode(true);
        setAuthPassword('');
        setAuthConfirmPassword('');
        setAuthLoading(false);
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setCurrentUser(data.user);
      setProfileName(data.user.name || '');
      showToast(`Hoş geldiniz, ${data.user.name || data.user.email}!`);
    } catch (err) {
      setAuthError('Sunucu bağlantı hatası.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleInstantDemoLogin = async (roleType) => {
    setAuthError('');
    setAuthLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/demo-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleType })
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'Demo giriş yapılamadı.');
        setAuthLoading(false);
        return;
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setCurrentUser(data.user);
      setProfileName(data.user.name || '');
      showToast(`${roleType === 'manager' ? 'Yönetici' : 'Geliştirici'} olarak giriş yapıldı!`);
    } catch (err) {
      setAuthError('Sunucu hatası.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRequestResetCode = async (e) => {
    if (e) e.preventDefault();
    setForgotErr('');
    setForgotMsg('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!forgotEmail || !emailRegex.test(forgotEmail.trim())) {
      return setForgotErr('Lütfen geçerli bir e-posta adresi giriniz.');
    }

    setIsSendingCode(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        setForgotErr(data.error || 'İşlem gerçekleştirilemedi.');
        setIsSendingCode(false);
        return;
      }

      setForgotMsg('Doğrulama kodu e-posta adresinize gönderildi.');
      setTimeout(() => {
        setForgotStep(2);
        setCodeTimer(180);
        setResendCooldown(60);
      }, 700);
    } catch (err) {
      setForgotErr('Sunucu bağlantı hatası.');
    } finally {
      setIsSendingCode(false);
    }
  };

  const handlePinChange = (index, value) => {
    const cleanVal = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...forgotCodeDigits];
    newDigits[index] = cleanVal;
    setForgotCodeDigits(newDigits);

    if (cleanVal && index < 5) {
      pinInputRefs.current[index + 1]?.focus();
    }
  };

  const handlePinKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !forgotCodeDigits[index] && index > 0) {
      pinInputRefs.current[index - 1]?.focus();
    }
  };

  const handlePinPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim().replace(/\D/g, '').slice(0, 6);
    const newDigits = ['', '', '', '', '', ''];
    for (let i = 0; i < pasteData.length; i++) {
      newDigits[i] = pasteData[i];
    }
    setForgotCodeDigits(newDigits);
    const nextIdx = Math.min(pasteData.length, 5);
    pinInputRefs.current[nextIdx]?.focus();
  };

  const handleVerifyCodeSubmit = async (e) => {
    e.preventDefault();
    setForgotErr('');
    setForgotMsg('');

    const fullCode = forgotCodeDigits.join('');
    if (fullCode.length !== 6) {
      return setForgotErr('Lütfen 6 haneli kodun tamamını giriniz.');
    }
    try {
      const res = await fetch(`${BASE_URL}/auth/verify-reset-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim(), code: fullCode })
      });
      const data = await res.json();
      if (!res.ok) return setForgotErr(data.error || 'Kod doğrulanamadı.');

      setForgotStep(3);
    } catch (err) {
      setForgotErr('Sunucu bağlantı hatası.');
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setForgotErr('');

    if (forgotNewPass.length < 8) {
      return setForgotErr('Şifreniz en az 8 karakter olmalıdır.');
    }

    if (forgotNewPass !== forgotConfirmPass) {
      return setForgotErr('Girdiğiniz şifreler birbiriyle eşleşmiyor.');
    }

    const fullCode = forgotCodeDigits.join('');
    try {
      const res = await fetch(`${BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail.trim(),
          code: fullCode,
          newPassword: forgotNewPass
        })
      });
      const data = await res.json();
      if (!res.ok) return setForgotErr(data.error || 'Şifre güncellenemedi.');

      setForgotStep(4);
    } catch (err) {
      setForgotErr('Sunucu bağlantı hatası.');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    setProfileErr('');
    try {
      const res = await fetch(`${BASE_URL}/user/profile`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: profileName,
          currentPassword: currentPass || undefined,
          newPassword: newPass || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) return setProfileErr(data.error || 'Profil güncellenemedi.');
      showToast('Profil bilgileriniz güncellendi!');
      setCurrentUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      setCurrentPass('');
      setNewPass('');
      setTimeout(() => {
        setProfileMsg('');
        setProfileView('menu');
      }, 800);
    } catch (err) {
      setProfileErr('Bağlantı hatası.');
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = window.confirm(
      'DİKKAT: Hesabınızı ve tüm panolarınızı kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz!'
    );
    if (!confirmation) return;

    try {
      const res = await fetch(`${BASE_URL}/user/account`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        showToast('Hesabınız başarıyla silindi.', 'error');
        handleLogout();
      } else {
        const data = await res.json();
        showToast(data.error || 'Hesap silinemedi.', 'error');
      }
    } catch (err) {
      showToast('Hesap silinemedi.', 'error');
    }
  };

  const fetchMyTasks = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${BASE_URL}/user/my-tasks`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (Array.isArray(data)) setMyTasksList(data);
    } catch (err) {
      console.error('Görevlerim çekilemedi:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    setToken('');
    setCurrentUser(null);
    setProjects([]);
    setTasks([]);
    setColumns([]);
    setActiveProjectId(null);
    setIsProfileMenuOpen(false);
    setIsChatOpen(false);
    setSelectedChatUser(null);
    setDirectMessages([]);
    setDmInputText('');
    setChatSearchUser('');
    setAllUsersList([]);
    setUnreadMessageCounts({});

    // Giriş formunda önceki kullanıcının bilgileri kalmasın.
    setAuthName('');
    setAuthEmail('');
    setAuthPassword('');
    setAuthConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setAuthError('');
    setEmailError('');
    setPassError('');
    setRegisterSuccessMsg('');
    setIsLoginMode(true);

    // Şifre sıfırlama akışı da temiz başlasın.
    setShowForgotModal(false);
    setForgotStep(1);
    setForgotEmail('');
    setForgotCodeDigits(['', '', '', '', '', '']);
    setForgotNewPass('');
    setForgotConfirmPass('');
    setForgotErr('');
    setForgotMsg('');

    showToast('Oturum kapatıldı.');
  };

  const fetchProjects = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${BASE_URL}/projects`, { headers: getAuthHeaders() });
      if (res.status === 401 || res.status === 403) return handleLogout();
      const data = await res.json();
      setProjects(data);

      if (data && data.length > 0) {
        setActiveProjectId((prev) => {
          const exists = data.some((p) => p.id === prev);
          return exists ? prev : data[0].id;
        });
      }
    } catch (err) {
      console.error('Panolar alınamadı:', err);
    }
  };

  const fetchColumns = async (projId) => {
    const id = projId || activeProjectId;
    if (!token || !id) return;
    try {
      const res = await fetch(`${BASE_URL}/projects/${id}/columns`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (Array.isArray(data)) {
        setColumns(data);
        if (data.length > 0) {
          setCreateTaskColId((prev) => {
            const exists = data.some((c) => c.id.toString() === prev);
            return exists ? prev : data[0].id.toString();
          });
        }
      }
    } catch (err) {
      console.error('Sütunlar alınamadı:', err);
    }
  };

  const fetchTasks = async (projId) => {
    const id = projId || activeProjectId;
    if (!token || !id) return;
    try {
      const res = await fetch(`${BASE_URL}/tasks?projectId=${id}`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (Array.isArray(data)) {
        setTasks(data);
        if (activeTask) {
          const current = data.find((t) => t.id === activeTask.id);
          if (current) setActiveTask(current);
        }
      }
    } catch (err) {
      console.error('Görevler alınamadı:', err);
    }
  };

  const fetchProjectMembers = async (projId) => {
    const id = projId || activeProjectId;
    if (!token || !id) return;
    try {
      const res = await fetch(`${BASE_URL}/projects/${id}/members`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (Array.isArray(data)) setProjectMembers(data);
    } catch (err) {
      console.error('Üyeler alınamadı:', err);
    }
  };

  const fetchAllUsers = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${BASE_URL}/users`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (Array.isArray(data)) {
        const hiddenDemoEmails = new Set([
          'demo@trello.com',
          'dev@demo.com',
          'manager@demo.com',
          'yonetici@demo.com',
          'gelistirici@demo.com'
        ]);

        setAllUsersList(
          data.filter(
            (u) =>
              u.id !== currentUser?.id &&
              !hiddenDemoEmails.has((u.email || '').toLowerCase())
          )
        );
      }
    } catch (err) {
      console.error('Kullanıcılar alınamadı:', err);
    }
  };

  const fetchDirectMessages = async (targetUserId) => {
    if (!token || !targetUserId) return;
    try {
      const res = await fetch(`${BASE_URL}/direct-messages/${targetUserId}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (Array.isArray(data)) setDirectMessages(data);
    } catch (err) {
      console.error('Mesajlar alınamadı:', err);
    }
  };

  // Okunmamış mesaj rozetleri yalnızca bu cihazda tutulur.
  // Veritabanı/Prisma yapısına dokunmadığı için mevcut mesaj sistemini etkilemez.
  const getChatReadKey = (otherUserId) =>
    `panovio_chat_last_read_${currentUser?.id || 'guest'}_${otherUserId}`;

  const markConversationAsRead = (otherUserId, messages = directMessages) => {
    if (!currentUser?.id || !otherUserId || !Array.isArray(messages)) return;

    const incomingMessages = messages.filter(
      (msg) => msg.senderId === otherUserId && msg.receiverId === currentUser.id
    );

    const latestIncoming = incomingMessages[incomingMessages.length - 1];
    if (latestIncoming?.id) {
      localStorage.setItem(getChatReadKey(otherUserId), String(latestIncoming.id));
    }

    setUnreadMessageCounts((prev) => ({
      ...prev,
      [otherUserId]: 0
    }));
  };

  const refreshUnreadMessageCounts = async (users = allUsersList) => {
    if (!token || !currentUser?.id || !Array.isArray(users) || users.length === 0) return;

    try {
      const entries = await Promise.all(
        users.map(async (u) => {
          const res = await fetch(`${BASE_URL}/direct-messages/${u.id}`, {
            headers: getAuthHeaders()
          });

          if (!res.ok) return [u.id, 0];

          const messages = await res.json();
          if (!Array.isArray(messages)) return [u.id, 0];

          const incomingMessages = messages.filter(
            (msg) => msg.senderId === u.id && msg.receiverId === currentUser.id
          );

          if (incomingMessages.length === 0) return [u.id, 0];

          const key = getChatReadKey(u.id);
          const storedLastRead = localStorage.getItem(key);

          // İlk çalıştırmada eski konuşmaları bildirim gibi göstermiyoruz.
          if (storedLastRead === null) {
            const latestIncoming = incomingMessages[incomingMessages.length - 1];
            if (latestIncoming?.id) {
              localStorage.setItem(key, String(latestIncoming.id));
            }
            return [u.id, 0];
          }

          const lastReadId = Number(storedLastRead);
          const unreadCount = incomingMessages.filter(
            (msg) => Number(msg.id) > lastReadId
          ).length;

          return [u.id, unreadCount];
        })
      );

      setUnreadMessageCounts(Object.fromEntries(entries));
    } catch (err) {
      console.error('Okunmamış mesajlar kontrol edilemedi:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProjects();
      fetchAllUsers();
      fetchMyTasks();
      if (currentUser?.name) setProfileName(currentUser.name);
    }
  }, [token]);

  useEffect(() => {
    if (token && activeProjectId) {
      fetchColumns(activeProjectId);
      fetchTasks(activeProjectId);
      fetchProjectMembers(activeProjectId);
    }
  }, [activeProjectId, token]);

  // Mesaj bildirimlerinin Ekip Sohbeti kapalıyken de çalışabilmesi için
  // kullanıcı listesini girişten sonra otomatik hazırla.
  useEffect(() => {
    if (token && currentUser?.id) {
      fetchAllUsers();
    }
  }, [token, currentUser?.id]);

  useEffect(() => {
    if (selectedChatUser) {
      fetchDirectMessages(selectedChatUser.id);
    }
  }, [selectedChatUser]);

  // Kullanıcı listesi geldikten sonra okunmamış mesajları kontrol et.
  // 8 saniyelik hafif kontrol WebSocket eklemeden masaüstü/web için bildirim hissi verir.
  useEffect(() => {
    if (!token || !currentUser?.id || allUsersList.length === 0) return;

    refreshUnreadMessageCounts(allUsersList);
    const intervalId = setInterval(
      () => refreshUnreadMessageCounts(allUsersList),
      8000
    );

    return () => clearInterval(intervalId);
  }, [token, currentUser?.id, allUsersList]);

  // Açık olan konuşmadaki mesajlar görülmüş kabul edilir.
  useEffect(() => {
    if (selectedChatUser && directMessages.length >= 0) {
      markConversationAsRead(selectedChatUser.id, directMessages);
    }
  }, [selectedChatUser?.id, directMessages]);

  // Ekip sohbeti: panel dışına tıklanınca profil menüsü gibi kapanır.
  useEffect(() => {
    if (!isChatOpen) return;

    const handleChatClickOutside = (e) => {
      if (chatDockRef.current && !chatDockRef.current.contains(e.target)) {
        setIsChatOpen(false);
        setSelectedChatUser(null);
        setChatSearchUser('');
      }
    };

    document.addEventListener('mousedown', handleChatClickOutside);
    return () => document.removeEventListener('mousedown', handleChatClickOutside);
  }, [isChatOpen]);

  const handleCreateProject = async (e) => {
    if (e) e.preventDefault();
    setNewProjectError('');

    const trimmedTitle = newProjectTitle.trim();
    if (!trimmedTitle) {
      setNewProjectError('Pano adı gerekli.');
      return;
    }

    if (projects.some((p) => p.title.toLowerCase() === trimmedTitle.toLowerCase())) {
      setNewProjectError('Bu isimde bir pano zaten var.');
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/projects`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ title: trimmedTitle })
      });
      if (res.ok) {
        const created = await res.json();
        setNewProjectTitle('');
        setNewProjectError('');
        setShowAddProject(false);
        showToast(`"${created.title}" panosu oluşturuldu!`);
        await fetchProjects();
        setActiveProjectId(created.id);
      }
    } catch (err) {
      showToast('Pano oluşturulamadı.', 'error');
    }
  };

  const handleRenameProject = async () => {
    const trimmed = projectTitleInput.trim();
    if (!trimmed || !activeProjectId || !isManagerOfCurrentProject) {
      setIsEditingProjectTitle(false);
      return;
    }

    setProjects(projects.map((p) => (p.id === activeProjectId ? { ...p, title: trimmed } : p)));
    setIsEditingProjectTitle(false);

    try {
      const res = await fetch(`${BASE_URL}/projects/${activeProjectId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ title: trimmed })
      });
      if (res.ok) {
        showToast('Pano adı güncellendi!');
      } else {
        showToast('Pano adı değiştirilemedi.', 'error');
        fetchProjects();
      }
    } catch (err) {
      showToast('Pano adı güncellenemedi.', 'error');
      fetchProjects();
    }
  };

  const handleDeleteProject = async (projId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Bu panoyu ve içindeki tüm verileri silmek istediğinize emin misiniz?')) return;

    try {
      const res = await fetch(`${BASE_URL}/projects/${projId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        showToast('Pano silindi.');
        const updated = projects.filter((p) => p.id !== projId);
        setProjects(updated);
        if (activeProjectId === projId && updated.length > 0) {
          setActiveProjectId(updated[0].id);
        }
      }
    } catch (err) {
      showToast('Pano silinemedi.', 'error');
    }
  };

  const handleAddColumn = async (e) => {
    if (e) e.preventDefault();
    if (!newColumnTitle.trim() || !activeProjectId) return;

    try {
      const res = await fetch(`${BASE_URL}/projects/${activeProjectId}/columns`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ title: newColumnTitle.trim(), color: newColumnColor })
      });
      if (res.ok) {
        setNewColumnTitle('');
        setNewColumnColor('#f59e0b');
        setShowAddColumn(false);
        showToast('Yeni liste eklendi.');
        fetchColumns(activeProjectId);
      }
    } catch (err) {
      showToast('Liste eklenemedi.', 'error');
    }
  };

  const handleRenameColumn = async (colId) => {
    const trimmed = editingColTitle.trim();
    if (!trimmed) {
      setEditingColId(null);
      return;
    }

    setColumns(columns.map((c) => (c.id === colId ? { ...c, title: trimmed } : c)));
    setEditingColId(null);

    try {
      await fetch(`${BASE_URL}/columns/${colId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ title: trimmed })
      });
      showToast('Liste başlığı güncellendi.');
    } catch (err) {
      showToast('Liste başlığı güncellenemedi.', 'error');
      fetchColumns(activeProjectId);
    }
  };

  const handleDeleteColumn = async (colId) => {
    const targetCol = columns.find((c) => c.id === colId);
    const colTasksCount = tasks.filter((t) => t.columnId === colId).length;

    let confirmMsg = `"${targetCol?.title || 'Bu liste'}" listesini silmek istediğinize emin misiniz?`;
    if (colTasksCount > 0) {
      confirmMsg = `DİKKAT: "${targetCol?.title}" listesinin içerisinde ${colTasksCount} adet görev kartı bulunuyor! Listeyi silerseniz içindeki tüm kartlar da silinecektir. Devam etmek istiyor musunuz?`;
    }

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`${BASE_URL}/columns/${colId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        showToast('Liste başarıyla silindi.');
        fetchColumns(activeProjectId);
        fetchTasks(activeProjectId);
      }
    } catch (err) {
      showToast('Liste silinemedi.', 'error');
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !activeProjectId) return;

    try {
      const res = await fetch(`${BASE_URL}/projects/${activeProjectId}/members`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Üye eklenemedi.', 'error');
        return;
      }
      showToast(`${inviteEmail} panoya başarıyla eklendi!`);
      setInviteEmail('');
      fetchProjectMembers(activeProjectId);
    } catch (err) {
      showToast('Sunucu hatası: Üye eklenemedi.', 'error');
    }
  };
  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Bu kullanıcıyı panodan çıkarmak istiyor musunuz?')) return;
    try {
      const res = await fetch(`${BASE_URL}/projects/${activeProjectId}/members/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        showToast('Üye panodan çıkarıldı.');
        fetchProjectMembers(activeProjectId);
      }
    } catch (err) {
      showToast('Üye çıkarılamadı.', 'error');
    }
  };

  const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;
  const ACCEPTED_ATTACHMENT_EXTENSIONS = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.png,.jpg,.jpeg,.webp';

  const formatAttachmentSize = (bytes = 0) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const validateAndAddFiles = (fileList, currentFiles, setter) => {
    const incoming = Array.from(fileList || []);
    const valid = [];
    for (const file of incoming) {
      if (file.size > MAX_ATTACHMENT_SIZE) {
        showToast(`${file.name}: Dosya 10 MB'dan büyük.`, 'error');
        continue;
      }
      if (currentFiles.length + valid.length >= 5) {
        showToast('Bir seferde en fazla 5 dosya seçebilirsiniz.', 'error');
        break;
      }
      valid.push(file);
    }
    setter([...currentFiles, ...valid]);
  };

  const uploadAttachmentsForTask = async (taskId, files) => {
    if (!files?.length) return true;
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    const res = await fetch(`${BASE_URL}/tasks/${taskId}/attachments`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Dosyalar yüklenemedi.');
    }
    return true;
  };

  const handleDownloadAttachment = async (attachment) => {
    try {
      const res = await fetch(`${BASE_URL}/attachments/${attachment.id}/download`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Dosya açılamadı.');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const opened = window.open(url, '_blank', 'noopener,noreferrer');
      if (!opened) {
        const a = document.createElement('a');
        a.href = url;
        a.download = attachment.originalName;
        a.click();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      showToast(err.message || 'Dosya açılamadı.', 'error');
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!window.confirm('Bu dosyayı görevden kaldırmak istiyor musunuz?')) return;
    try {
      const res = await fetch(`${BASE_URL}/attachments/${attachmentId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Dosya silinemedi.');
      }
      setActiveTask(prev => prev ? { ...prev, attachments: (prev.attachments || []).filter(a => a.id !== attachmentId) } : prev);
      showToast('Dosya kaldırıldı.');
      fetchTasks(activeProjectId);
    } catch (err) {
      showToast(err.message || 'Dosya silinemedi.', 'error');
    }
  };

  const handleOpenCreateTaskModal = (colId = null) => {
    setCreateTaskColId(colId ? colId.toString() : (columns[0]?.id?.toString() || ''));
    setCreateTitle('');
    setCreateDescription('');
    setCreatePriority('medium');
    setCreateStartDate('');
    setCreateDueDate('');
    setCreateAssignedToId(currentUser?.id?.toString() || '');
    setCreateAttachments([]);
    setShowCreateTaskModal(true);
  };

  const handleSaveNewTask = async (e) => {
    e.preventDefault();
    if (!createTitle.trim() || !activeProjectId) return;

    if (createStartDate && createDueDate && new Date(createStartDate) > new Date(createDueDate)) {
      showToast('Başlangıç tarihi bitiş tarihinden sonra olamaz.', 'error');
      return;
    }

    const targetCol = createTaskColId || (columns[0] ? columns[0].id : null);

    try {
      const res = await fetch(`${BASE_URL}/tasks`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: createTitle.trim(),
          description: createDescription.trim() || null,
          priority: createPriority,
          startDate: createStartDate || null,
          dueDate: createDueDate || null,
          projectId: activeProjectId,
          columnId: targetCol,
          assignedToId: createAssignedToId ? parseInt(createAssignedToId) : null
        })
      });

      if (res.ok) {
        const createdTask = await res.json();
        try {
          await uploadAttachmentsForTask(createdTask.id, createAttachments);
          showToast(createAttachments.length ? 'Görev ve dosyaları oluşturuldu!' : 'Yeni görev kartı oluşturuldu!');
        } catch (uploadErr) {
          showToast(`Görev oluşturuldu fakat dosya yüklenemedi: ${uploadErr.message}`, 'error');
        }
        setCreateAttachments([]);
        setShowCreateTaskModal(false);
        fetchTasks(activeProjectId);
        fetchMyTasks();
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || 'Kart oluşturulamadı.', 'error');
      }
    } catch (err) {
      showToast('Kart oluşturulamadı.', 'error');
    }
  };

  const handleDuplicateTask = async (task, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch(`${BASE_URL}/tasks`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: `${task.title} (Kopya)`,
          description: task.description || null,
          priority: task.priority,
          startDate: task.startDate || null,
          dueDate: task.dueDate || null,
          projectId: task.projectId,
          columnId: task.columnId,
          assignedToId: task.assignedToId || null
        })
      });
      if (res.ok) {
        showToast('Kart başarıyla kopyalandı!');
        fetchTasks(activeProjectId);
      }
    } catch (err) {
      showToast('Kart kopyalanamadı.', 'error');
    }
  };

  const handleDeleteTask = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch(`${BASE_URL}/tasks/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        if (activeTask && activeTask.id === id) setActiveTask(null);
        showToast('Kart silindi.');
        fetchTasks(activeProjectId);
        fetchMyTasks();
      }
    } catch (err) {
      showToast('Kart silinemedi.', 'error');
    }
  };

  const onDragEnd = async (result) => {
    const { source, destination, draggableId, type } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    if (type === 'column') {
      const reorderedCols = Array.from(columns);
      const [movedCol] = reorderedCols.splice(source.index, 1);
      reorderedCols.splice(destination.index, 0, movedCol);

      setColumns(reorderedCols);

      try {
        await fetch(`${BASE_URL}/projects/${activeProjectId}/columns/reorder`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            orderedColumnIds: reorderedCols.map((c) => c.id)
          })
        });
      } catch (err) {
        console.error('Sütun sırası kaydedilemedi:', err);
        fetchColumns(activeProjectId);
      }
      return;
    }

    const targetColId = parseInt(destination.droppableId);
    const taskId = parseInt(draggableId);
    const destCol = columns.find((c) => c.id === targetColId);

    const updatedTasks = tasks.map((t) => (t.id === taskId ? { ...t, columnId: targetColId } : t));
    setTasks(updatedTasks);

    try {
      await fetch(`${BASE_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ columnId: targetColId, columnName: destCol?.title })
      });
      fetchTasks(activeProjectId);
      fetchMyTasks();
    } catch (err) {
      console.error('Durum güncellenemedi:', err);
      fetchTasks(activeProjectId);
    }
  };

  const openEditModal = (task) => {
    setActiveTask(task);
    setEditTitle(task.title);
    setEditDesc(task.description || '');
    setEditPriority(task.priority);
    setEditStartDate(task.startDate || '');
    setEditDueDate(task.dueDate || '');
    setEditColumnId(task.columnId ? task.columnId.toString() : (columns[0]?.id?.toString() || ''));
    setEditAssignedToId(task.assignedToId ? task.assignedToId.toString() : '');
    setEditAttachments([]);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editTitle.trim()) return;

    if (editStartDate && editDueDate && new Date(editStartDate) > new Date(editDueDate)) {
      showToast('Başlangıç tarihi bitiş tarihinden sonra olamaz.', 'error');
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/tasks/${activeTask.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDesc.trim() || null,
          priority: editPriority,
          startDate: editStartDate || null,
          dueDate: editDueDate || null,
          columnId: parseInt(editColumnId),
          assignedToId: editAssignedToId ? parseInt(editAssignedToId) : null
        })
      });

      if (res.ok) {
        try {
          await uploadAttachmentsForTask(activeTask.id, editAttachments);
          showToast(editAttachments.length ? 'Değişiklikler ve dosyalar kaydedildi!' : 'Değişiklikler kaydedildi!');
        } catch (uploadErr) {
          showToast(`Değişiklikler kaydedildi fakat dosya yüklenemedi: ${uploadErr.message}`, 'error');
        }
        setEditAttachments([]);
        setActiveTask(null);
        fetchTasks(activeProjectId);
        fetchMyTasks();
      }
    } catch (err) {
      showToast('Güncelleme hatası.', 'error');
    }
  };

  const handleAddChecklistItem = async (e) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;

    try {
      const res = await fetch(`${BASE_URL}/tasks/${activeTask.id}/items`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ title: newChecklistText.trim() })
      });

      if (res.ok) {
        setNewChecklistText('');
        fetchTasks(activeProjectId);
      }
    } catch (err) {
      showToast('Madde eklenemedi.', 'error');
    }
  };

  const handleToggleChecklistItem = async (itemId, isCompleted) => {
    try {
      const res = await fetch(`${BASE_URL}/items/${itemId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ isCompleted: !isCompleted })
      });
      if (res.ok) fetchTasks(activeProjectId);
    } catch (err) {
      console.error('Durum değiştirilemedi:', err);
    }
  };

  const handleDeleteChecklistItem = async (itemId) => {
    try {
      const res = await fetch(`${BASE_URL}/items/${itemId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) fetchTasks(activeProjectId);
    } catch (err) {
      console.error('Madde silinemedi:', err);
    }
  };

  const handleAddLabel = async (e) => {
    e.preventDefault();
    if (!newLabelText.trim()) return;

    try {
      const res = await fetch(`${BASE_URL}/tasks/${activeTask.id}/labels`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          text: newLabelText.trim(),
          color: selectedLabelColor
        })
      });

      if (res.ok) {
        setNewLabelText('');
        fetchTasks(activeProjectId);
      }
    } catch (err) {
      showToast('Etiket eklenemedi.', 'error');
    }
  };

  const handleDeleteLabel = async (labelId) => {
    try {
      const res = await fetch(`${BASE_URL}/labels/${labelId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) fetchTasks(activeProjectId);
    } catch (err) {
      console.error('Etiket silinemedi:', err);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    try {
      const res = await fetch(`${BASE_URL}/tasks/${activeTask.id}/comments`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ text: newCommentText.trim() })
      });

      if (res.ok) {
        setNewCommentText('');
        fetchTasks(activeProjectId);
      }
    } catch (err) {
      showToast('Yorum gönderilemedi.', 'error');
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const res = await fetch(`${BASE_URL}/comments/${commentId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) fetchTasks(activeProjectId);
    } catch (err) {
      console.error('Yorum silinemedi:', err);
    }
  };

  const handleSendDirectMessage = async (e) => {
    e.preventDefault();

    const messageText = dmInputText.trim();
    if (!messageText || !selectedChatUser) return;

    try {
      const res = await fetch(`${BASE_URL}/direct-messages`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          receiverId: selectedChatUser.id,
          text: messageText
        })
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Mesaj gönderilemedi.', 'error');
        return;
      }

      setDmInputText('');
      await fetchDirectMessages(selectedChatUser.id);
    } catch (err) {
      console.error('Mesaj gönderilemedi:', err);
      showToast('Mesaj gönderilemedi.', 'error');
    }
  };

  const calculateProgress = (items) => {
    if (!items || items.length === 0) return 0;
    const completed = items.filter((i) => i.isCompleted).length;
    return Math.round((completed / items.length) * 100);
  };

  const formatCommentDate = (dateStr) => {
    const commentDate = new Date(dateStr);
    const today = new Date();
    const isToday = commentDate.toDateString() === today.toDateString();
    
    const timeFormatted = commentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) {
      return timeFormatted;
    } else {
      const day = commentDate.getDate();
      const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
      const monthStr = months[commentDate.getMonth()];
      return `${day} ${monthStr} • ${timeFormatted}`;
    }
  };

  const getCardCompactDueDate = (dueDate, columnId) => {
    if (!dueDate) return null;
    const isDone = columns.length > 0 && columnId === columns[columns.length - 1]?.id;
    
    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    const d = new Date(dueDate);
    const dayStr = `${d.getDate()} ${months[d.getMonth()]}`;

    if (isDone) return { label: `✓ ${dayStr}`, className: '', tooltip: `Teslim tarihi: ${dueDate} • Tamamlandı` };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: `⚠️ ${dayStr} · Gecikti`, className: 'overdue', tooltip: `Teslim tarihi: ${dueDate} • Gecikti` };
    }
    if (diffDays <= 2) {
      return { label: `⏳ ${dayStr}`, className: 'soon', tooltip: `Teslim tarihi: ${dueDate} • Yaklaşıyor` };
    }
    return { label: `📅 ${dayStr}`, className: '', tooltip: `Teslim tarihi: ${dueDate}` };
  };

  const availableLabelsInBoard = Array.from(
    new Set(tasks.flatMap((t) => t.labels?.map((l) => l.text) || []))
  );

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    const matchesMyTasks = !onlyMyTasks || task.assignedToId === currentUser?.id;
    const matchesTag =
      selectedTagFilter === 'all' || task.labels?.some((l) => l.text === selectedTagFilter);

    let matchesDueDate = true;
    if (filterDueDate !== 'all' && task.dueDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const due = new Date(task.dueDate);
      due.setHours(0, 0, 0, 0);
      const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));

      if (filterDueDate === 'today') {
        matchesDueDate = diffDays === 0;
      } else if (filterDueDate === 'week') {
        matchesDueDate = diffDays >= 0 && diffDays <= 7;
      } else if (filterDueDate === 'overdue') {
        matchesDueDate = diffDays < 0;
      }
    } else if (filterDueDate !== 'all' && !task.dueDate) {
      matchesDueDate = false;
    }

    return matchesSearch && matchesPriority && matchesMyTasks && matchesTag && matchesDueDate;
  });

  const handleNavigateToTask = (task) => {
    if (task.projectId !== activeProjectId) {
      setActiveProjectId(task.projectId);
    }
    setIsProfileMenuOpen(false);
    openEditModal(task);
  };

  const activeFiltersCount = (filterPriority !== 'all' ? 1 : 0) +
                             (filterDueDate !== 'all' ? 1 : 0) +
                             (selectedTagFilter !== 'all' ? 1 : 0);

  const handleClearAllFilters = () => {
    setFilterPriority('all');
    setFilterDueDate('all');
    setSelectedTagFilter('all');
    setIsFiltersOpen(false);
  };

  // ==========================================
  // 🔐 1. GİRİŞ & GELİŞMİŞ KAYIT EKRANI
  // ==========================================
  if (!token) {
    const isPasswordLengthValid = authPassword.length >= 8;

    return (
      <div className="auth-hero-wrapper">
        <div className="auth-split-container">
          <div className="auth-showcase-panel">
            <div className="auth-showcase-top">
              <div className="auth-brand-head">
                <div className="logo-glow-wrapper">
                  <PanovioLogoBadge size={46} />
                </div>
              </div>

              <div className="showcase-badge">
                <Sparkles size={13} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> 
                Akıllı Proje ve Görev Yönetimi
              </div>
              
              <h1>Tüm Projelerinizi Tek Bir Merkezden Yönetin.</h1>
              
              <p className="showcase-desc">
                Panolarınızı yönetin, ekip arkadaşlarınıza görev atayın ve projelerinizi tek yerden takip edin.
              </p>
            </div>

            <div className="showcase-features">
              <div className="feature-item">
                <div className="feature-icon"><TrendingUp size={16} /></div>
                <div>
                  <strong>Proje Bazlı Dinamik Roller</strong>
                  <p>Her panoda üyelere yönetici veya geliştirici rolü atayın.</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon"><Users size={16} /></div>
                <div>
                  <strong>Ekip İletişimi & Görev Paylaşımı</strong>
                  <p>Üyeleri panoya davet edin, görev paylaşın ve anlık iletişim kurun.</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon"><Kanban size={16} /></div>
                <div>
                  <strong>İnteraktif Sürükle & Bırak</strong>
                  <p>Kartları ve sütunları sürükleyerek kolayca düzenleyin.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="auth-form-panel">
            <div className="auth-card-modern">
              <div className="auth-header-wrapper">
                {!isLoginMode ? (
                  <button
                    type="button"
                    className="btn-header-back-col"
                    onClick={() => {
                      setIsLoginMode(true);
                      setAuthError('');
                      setEmailError('');
                      setPassError('');
                      setRegisterSuccessMsg('');
                    }}
                    title="Giriş ekranına dön"
                  >
                    <ArrowLeft size={20} />
                  </button>
                ) : (
                  <div className="auth-header-spacer" />
                )}

                <div className="auth-header-content">
                  <h2>{isLoginMode ? 'Hoş Geldiniz' : 'Hesabınızı Oluşturun'}</h2>
                  <p>
                    {isLoginMode 
                      ? 'E-posta ve şifrenizle giriş yapın' 
                      : 'Projelerinizi yönetmeye hemen başlayın.'}
                  </p>
                </div>

                <div className="auth-header-spacer" />
              </div>
              {registerSuccessMsg && (
                <div className="register-success-alert">
                  <CheckCircle2 size={16} />
                  <span>{registerSuccessMsg}</span>
                </div>
              )}

              {authError && <div className="auth-error">{authError}</div>}

              <form onSubmit={handleAuthSubmit} className="auth-modern-form">
                {!isLoginMode && (
                  <div>
                    <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                      Adınız Soyadınız
                    </label>
                    <div className="input-field-wrap">
                      <User size={18} />
                      <input
                        type="text"
                        placeholder="Örn. Ahmet Yılmaz"
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        required
                        autoFocus
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                    E-posta Adresiniz
                  </label>
                  <div className="input-field-wrap">
                    <Mail size={18} />
                    <input
                      type="email"
                      name="panovio-login-email"
                      autoComplete="off"
                      placeholder="ornek@email.com"
                      value={authEmail}
                      onChange={(e) => {
                        setAuthEmail(e.target.value);
                        if (emailError) setEmailError('');
                      }}
                      required
                    />
                  </div>
                  {emailError && (
                    <div className="field-error-text">
                      <AlertTriangle size={13} /> {emailError}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                    Şifreniz
                  </label>
                  <div className="input-field-wrap">
                    <Lock size={18} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="panovio-login-password"
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={authPassword}
                      onChange={(e) => {
                        setAuthPassword(e.target.value);
                        if (passError) setPassError('');
                      }}
                      required
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {!isLoginMode && (
                    <div className={`password-rule-pill ${isPasswordLengthValid ? 'valid' : ''}`}>
                      {isPasswordLengthValid && <Check size={13} strokeWidth={2.6} />}
                      <span>En az 8 karakter kullanın.</span>
                    </div>
                  )}
                </div>

                {!isLoginMode && (
                  <div>
                    <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                      Şifre Tekrar
                    </label>
                    <div className="input-field-wrap">
                      <Lock size={18} />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={authConfirmPassword}
                        onChange={(e) => {
                          setAuthConfirmPassword(e.target.value);
                          if (passError) setPassError('');
                        }}
                        required
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {passError && (
                      <div className="field-error-text">
                        <AlertTriangle size={13} /> {passError}
                      </div>
                    )}
                  </div>
                )}

                {isLoginMode && (
                  <div className="forgot-password-link-wrap">
                    <button
                      type="button"
                      className="btn-forgot-link"
                      onClick={() => {
                        setForgotEmail('');
                        setForgotCodeDigits(['', '', '', '', '', '']);
                        setForgotNewPass('');
                        setForgotConfirmPass('');
                        setForgotStep(1);
                        setForgotErr('');
                        setForgotMsg('');
                        setShowForgotModal(true);
                      }}
                    >
                      Şifremi unuttum?
                    </button>
                  </div>
                )}

                <button type="submit" className="btn-modern-submit" disabled={authLoading}>
                  {authLoading
                    ? isLoginMode
                      ? 'Giriş yapılıyor...'
                      : 'Hesap oluşturuluyor...'
                    : isLoginMode
                    ? 'Giriş Yap'
                    : 'Hesap Oluştur'}
                </button>
              </form>

              {isLoginMode && (
                <>
                  <div className="demo-accounts-divider">
                    <span>KAYIT OLMADAN KEŞFEDİN</span>
                  </div>
                  <div className="demo-quick-buttons">
                    <button
                      type="button"
                      className="btn-demo-fill"
                      onClick={() => handleInstantDemoLogin('manager')}
                      disabled={authLoading}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <ShieldCheck size={16} color="#38bdf8" />
                      <span>Yönetici Demoyu İncele</span>
                    </button>
                    <button
                      type="button"
                      className="btn-demo-fill"
                      onClick={() => handleInstantDemoLogin('developer')}
                      disabled={authLoading}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <Code2 size={16} color="#818cf8" />
                      <span>Geliştirici Demoyu İncele</span>
                    </button>
                  </div>
                </>
              )}

              <div className="auth-switch-footer">
                <span>{isLoginMode ? 'Hesabınız yok mu?' : 'Zaten hesabınız var mı?'}</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsLoginMode(!isLoginMode);
                    setAuthError('');
                    setEmailError('');
                    setPassError('');
                    setRegisterSuccessMsg('');
                  }}
                >
                  {isLoginMode ? 'Kayıt Ol' : 'Giriş Yap'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {showForgotModal && (
          <div className="modal-backdrop" onClick={() => setShowForgotModal(false)}>
            <div className="modal-card modal-card-sm forgot-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="forgot-header">
                <div className="forgot-title-wrap">
                  <KeyRound size={19} color="#38bdf8" />
                  <h3>
                    {forgotStep === 1 && 'Şifre Sıfırlama'}
                    {forgotStep === 2 && 'Kodu Doğrula'}
                    {forgotStep === 3 && 'Yeni Şifre'}
                    {forgotStep === 4 && 'İşlem Başarılı'}
                  </h3>
                </div>
                <button
                  type="button"
                  className="btn-modal-close-custom"
                  onClick={() => setShowForgotModal(false)}
                  title="Kapat"
                >
                  <X size={18} strokeWidth={2.4} />
                </button>
              </div>

              {forgotErr && <div className="auth-error" style={{ margin: '14px 24px 0' }}>{forgotErr}</div>}
              {forgotMsg && (
                <div className="forgot-feedback-success">
                  <CheckCircle2 size={16} />
                  <span>{forgotMsg}</span>
                </div>
              )}

              {forgotStep === 1 && (
                <form onSubmit={handleRequestResetCode} style={{ padding: '20px 24px' }}>
                  <p className="forgot-desc-text">
                    Hesabınıza ait e-posta adresini girin.
                  </p>
                  <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#94a3b8', display: 'block', textAlign: 'left', marginBottom: '6px' }}>
                    E-posta Adresiniz
                  </label>
                  <div className="forgot-input-wrap">
                    <Mail size={16} className="forgot-input-icon" />
                    <input
                      type="email"
                      name="panovio-reset-email"
                      autoComplete="off"
                      placeholder="ornek@email.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                  <div style={{ marginTop: '22px' }}>
                    <button type="submit" className="btn-forgot-submit" disabled={isSendingCode}>
                      {isSendingCode ? 'Kod gönderiliyor...' : 'Doğrulama Kodu Gönder'}
                    </button>
                  </div>
                </form>
              )}

              {forgotStep === 2 && (
                <form onSubmit={handleVerifyCodeSubmit} style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#94a3b8', margin: 0 }}>
                      6 Haneli Doğrulama Kodu
                    </label>
                    <span className="security-timer-pill">
                      <Clock size={13} /> {formatTimer(codeTimer)}
                    </span>
                  </div>

                  <div className="pin-input-grid" onPaste={handlePinPaste}>
                    {forgotCodeDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (pinInputRefs.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handlePinChange(idx, e.target.value)}
                        onKeyDown={(e) => handlePinKeyDown(idx, e)}
                        className="pin-box"
                        required
                        autoFocus={idx === 0}
                      />
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '12px' }}>
                    <button
                      type="button"
                      className="btn-resend-code"
                      disabled={resendCooldown > 0}
                      onClick={() => handleRequestResetCode(null)}
                    >
                      {resendCooldown > 0 ? `Kodu yeniden gönder (${resendCooldown} sn)` : 'Kodu yeniden gönder'}
                    </button>
                  </div>

                  <div style={{ marginTop: '18px' }}>
                    <button type="submit" className="btn-forgot-submit">
                      Kodu Onayla
                    </button>
                  </div>
                </form>
              )}

              {forgotStep === 3 && (
                <form onSubmit={handleResetPasswordSubmit} style={{ padding: '20px 24px' }}>
                  <p className="forgot-desc-text">
                    Yeni şifrenizi belirleyin.
                  </p>

                  <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#94a3b8', display: 'block', textAlign: 'left', marginBottom: '6px' }}>
                    Yeni Şifre
                  </label>
                  <div className="input-field-wrap">
                    <Lock size={16} />
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={forgotNewPass}
                      onChange={(e) => setForgotNewPass(e.target.value)}
                      required
                      autoFocus
                    />
                    <button type="button" tabIndex={-1} onClick={() => setShowNewPass(!showNewPass)}>
                      {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#94a3b8', display: 'block', textAlign: 'left', marginTop: '12px', marginBottom: '6px' }}>
                    Yeni Şifre Tekrar
                  </label>
                  <div className="input-field-wrap">
                    <Lock size={16} />
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={forgotConfirmPass}
                      onChange={(e) => setForgotConfirmPass(e.target.value)}
                      required
                    />
                    <button type="button" tabIndex={-1} onClick={() => setShowConfirmPass(!showConfirmPass)}>
                      {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  <div style={{ marginTop: '20px' }}>
                    <button type="submit" className="btn-forgot-submit">
                      Şifreyi Güncelle
                    </button>
                  </div>
                </form>
              )}

              {forgotStep === 4 && (
                <div className="reset-success-box" style={{ padding: '30px 24px' }}>
                  <CheckCircle2 size={46} color="#34d399" style={{ margin: '0 auto' }} />
                  <h4>Şifreniz Başarıyla Güncellendi</h4>
                  <p>
                    Artık yeni şifrenizle hesabınıza güvenle giriş yapabilirsiniz.
                  </p>
                  <button
                    type="button"
                    className="btn-forgot-submit"
                    onClick={() => {
                      setShowForgotModal(false);
                      setForgotStep(1);
                      setForgotEmail('');
                      setForgotCodeDigits(['', '', '', '', '', '']);
                      setForgotNewPass('');
                      setForgotConfirmPass('');
                    }}
                  >
                    Giriş Yap
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // 📋 2. ANA PANO EKRANI
  // ==========================================
  return (
    <div className="trello-container" style={{ background: userCustomBg }}>
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast-item ${t.type}`}>
            {t.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Üst Profil Bar */}
      <div className="user-bar">
        <div className="brand-logo" style={{ display: 'flex', alignItems: 'center' }}>
          <PanovioLogoBadge size={34} />
        </div>

        <div className="user-bar-actions" ref={menuRef}>
          <button
            className="profile-nav-pill"
            onClick={() => {
              fetchMyTasks();
              setProfileView('menu');
              setIsProfileMenuOpen(!isProfileMenuOpen);
            }}
          >
            <div className="avatar-circle">
              {(currentUser?.name || currentUser?.email || 'U')[0].toUpperCase()}
            </div>
            <span>{currentUser?.name || currentUser?.email}</span>
          </button>

          {isProfileMenuOpen && (
            <div className="profile-dropdown-menu">
              {profileView === 'menu' ? (
                <>
                  <div className="dropdown-user-header">
                    <div className="avatar-circle" style={{ width: '40px', height: '40px', fontSize: '16px' }}>
                      {(currentUser?.name || currentUser?.email || 'U')[0].toUpperCase()}
                    </div>
                    <div style={{ textAlign: 'left', overflow: 'hidden' }}>
                      <h4>{currentUser?.name || 'Kullanıcı'}</h4>
                      <span>{currentUser?.email}</span>
                      <div style={{ marginTop: '4px', fontSize: '11px', color: '#38bdf8', fontWeight: 700 }}>
                        Bu panodaki rolünüz: {isManagerOfCurrentProject ? 'Yönetici' : 'Geliştirici'}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setProfileName(currentUser?.name || '');
                      setCurrentPass('');
                      setNewPass('');
                      setProfileMsg('');
                      setProfileErr('');
                      setProfileView('edit');
                    }}
                    className="dropdown-menu-btn profile-edit-action-btn"
                  >
                    <Edit2 size={15} /> Profili & Şifreyi Düzenle
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      fetchMyTasks();
                      setProfileView('tasks');
                    }}
                    className="dropdown-menu-btn dropdown-tasks-action-btn"
                  >
                    <span>📋 Bana Atanan Görevler</span>
                    <span className="task-count-badge">
                      {myTasksList.length}
                    </span>
                  </button>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Görünüm Modu</span>
                    <button
                      type="button"
                      onClick={() => setDarkMode(!darkMode)}
                      style={{ padding: '4px 12px', borderRadius: '20px', background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px' }}
                    >
                      {darkMode ? '☀️ Açık Tema' : '🌙 Koyu Tema'}
                    </button>
                  </div>

                  <div style={{ textAlign: 'left', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>SABİT ÇALIŞMA ALANI TEMASI</span>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#3b82f6', cursor: 'pointer', fontWeight: 'bold', position: 'relative' }}>
                        <input
                          type="color"
                          value={userCustomBg.startsWith('#') ? userCustomBg : '#3b82f6'}
                          onChange={(e) => handleSetGlobalBackground(e.target.value)}
                          style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', left: 0, top: 0, cursor: 'pointer' }}
                        />
                        <Pipette size={14} /> Özel Renk
                      </label>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                      {BOARD_THEMES.map((theme) => (
                        <div
                          key={theme.name}
                          onClick={() => handleSetGlobalBackground(theme.bg)}
                          style={{
                            height: '24px',
                            borderRadius: '6px',
                            background: theme.bg,
                            cursor: 'pointer',
                            border: userCustomBg === theme.bg ? '2px solid #3b82f6' : '1px solid rgba(0,0,0,0.15)'
                          }}
                          title={theme.name}
                        />
                      ))}
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="dropdown-logout-btn"
                    >
                      <LogOut size={14} /> Oturumu Kapat
                    </button>
                  </div>
                </>
              ) : profileView === 'edit' ? (
                <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setProfileView('menu')}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit' }}
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <strong style={{ fontSize: '13px' }}>Profili Düzenle</strong>
                  </div>

                  {profileMsg && <div className="invite-success" style={{ padding: '8px', fontSize: '11px' }}>{profileMsg}</div>}
                  {profileErr && <div className="auth-error" style={{ padding: '8px', fontSize: '11px' }}>{profileErr}</div>}

                  <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Adınız Soyadınız</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    required
                    style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--hover-bg)', color: 'inherit', fontSize: '12px' }}
                  />

                  <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Mevcut Şifreniz</label>
                  <input
                    type="password"
                    value={currentPass}
                    onChange={(e) => setCurrentPass(e.target.value)}
                    placeholder="Mevcut şifrenizi girin"
                    style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--hover-bg)', color: 'inherit', fontSize: '12px' }}
                  />

                  <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Yeni Şifreniz</label>
                  <input
                    type="password"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="Yeni şifreniz (En az 8 karakter)"
                    style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--hover-bg)', color: 'inherit', fontSize: '12px' }}
                  />

                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                    <button type="button" onClick={() => setProfileView('menu')} className="btn-cancel" style={{ flex: 1, padding: '8px' }}>
                      Geri
                    </button>
                    <button type="submit" className="btn-save" style={{ flex: 2, padding: '8px' }}>
                      Kaydet
                    </button>
                  </div>
                  <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                    <button
                      type="button"
                      className="btn-delete-account"
                      onClick={handleDeleteAccount}
                    >
                      <AlertTriangle size={13} /> Hesabımı Kalıcı Olarak Sil
                    </button>
                  </div>
                </form>
              ) : (
                <div style={{ textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setProfileView('menu')}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit' }}
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <strong style={{ fontSize: '13px' }}>Bana Atanan Görevler</strong>
                  </div>

                  {myTasksList.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px 0', color: '#64748b' }}>
                      <CheckCircle2 size={28} color="#10b981" style={{ margin: '0 auto 6px' }} />
                      <p style={{ fontSize: '11px', margin: 0 }}>Atanmış açık görev bulunmuyor.</p>
                    </div>
                  ) : (
                    <div className="profile-my-tasks-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
                      {myTasksList.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => handleNavigateToTask(t)}
                          style={{
                            background: 'var(--hover-bg)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            padding: '8px 10px',
                            cursor: 'pointer',
                            transition: 'transform 0.15s ease, border-color 0.15s ease'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#3b82f6')}
                          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#3b82f6', fontWeight: 'bold' }}>
                            <span>📁 {t.project?.title}</span>
                            <span className={`priority-tag ${t.priority}`}>
                              {t.priority === 'low' ? 'DÜŞÜK' : t.priority === 'medium' ? 'ORTA' : 'YÜKSEK'}
                            </span>
                          </div>
                          <h4 style={{ margin: '4px 0', fontSize: '12px' }}>{t.title}</h4>
                          <span style={{ fontSize: '10px', color: '#64748b' }}>📅 {t.dueDate || 'Tarih yok'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Pano Sekmeleri */}
      <div className="boards-bar">
        <div className="boards-list">
          {projects.map((project) => {
            const isManagerOfThis = project.currentUserRole === 'MANAGER';
            return (
              <div
                key={project.id}
                className={`board-tab ${activeProjectId === project.id ? 'active' : ''}`}
                onClick={() => setActiveProjectId(project.id)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
              >
                <Layout size={15} />
                <span>{project.title}</span>
                {isManagerOfThis && projects.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => handleDeleteProject(project.id, e)}
                    style={{ background: 'transparent', border: 'none', color: 'inherit', opacity: 0.6, cursor: 'pointer', padding: '0 2px' }}
                    title="Panoyu Sil"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            );
          })}

          {showAddProject ? (
            <form onSubmit={handleCreateProject} className="new-board-form-inline">
              <div className="new-board-input-wrap">
                <input
                  type="text"
                  placeholder="Pano adı..."
                  maxLength={30}
                  value={newProjectTitle}
                  onChange={(e) => {
                    setNewProjectTitle(e.target.value);
                    if (newProjectError) setNewProjectError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateProject(e);
                    if (e.key === 'Escape') setShowAddProject(false);
                  }}
                  autoFocus
                />
                {newProjectError && <span className="new-board-error-msg">{newProjectError}</span>}
              </div>
              <button type="submit" className="btn-pano-create-gradient">Pano Oluştur</button>
              <button type="button" onClick={() => { setShowAddProject(false); setNewProjectError(''); }} className="btn-pano-cancel-outline">İptal</button>
            </form>
          ) : (
            <button className="btn-new-board" onClick={() => setShowAddProject(true)}>
              <FolderPlus size={15} /> Yeni Pano
            </button>
          )}
        </div>
      </div>

      {/* 1. Pano Başlığı Alanı (Sadece İkon, Ad, Soluk Kalem) */}
      <header className="trello-header-custom">
        <div className="header-left">
          {isEditingProjectTitle && isManagerOfCurrentProject ? (
            <div className="project-title-edit-mode">
              <input
                type="text"
                maxLength={30}
                value={projectTitleInput}
                onChange={(e) => setProjectTitleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameProject();
                  if (e.key === 'Escape') setIsEditingProjectTitle(false);
                }}
                autoFocus
              />
              <button
                type="button"
                onClick={handleRenameProject}
                className="btn-edit-save-green"
                title="Kaydet"
              >
                <Check size={18} strokeWidth={2.8} />
              </button>
              <button
                type="button"
                onClick={() => setIsEditingProjectTitle(false)}
                className="btn-edit-cancel-outline"
                title="İptal"
              >
                <X size={16} strokeWidth={2.2} />
              </button>
            </div>
          ) : (
            <div
              className="project-title-view-mode"
              onClick={() => {
                if (isManagerOfCurrentProject) {
                  setIsEditingProjectTitle(true);
                  setProjectTitleInput(currentProject?.title || '');
                }
              }}
              title={isManagerOfCurrentProject ? 'Pano adını değiştirmek için tıkla' : ''}
            >
              <Layout size={24} color="#38bdf8" />
              <h1>{currentProject?.title || 'Çalışma Alanım'}</h1>
              {isManagerOfCurrentProject && (
                <Edit2 size={16} className="project-edit-icon" />
              )}
            </div>
          )}
        </div>
      </header>

      {/* 3. Toolbar: Ara + Filtreler + Bana Ait + Pano Menüsü | Sağ: Kompakt Genel İlerleme */}
      <div className="toolbar-modern" ref={filtersRef}>
        <div className="toolbar-left-group">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Kartlarda ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filtreler Popover */}
          <div className="filters-menu-wrap">
            <button
              type="button"
              className="btn-filters-toggle"
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            >
              <Filter size={16} />
              <span>Filtreler</span>
              {activeFiltersCount > 0 && (
                <span className="filters-count-badge">{activeFiltersCount}</span>
              )}
            </button>

            {isFiltersOpen && (
              <div className="filters-popover-dropdown">
                <div className="filter-popover-group">
                  <label>Öncelik</label>
                  <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
                    <option value="all">Tüm Öncelikler</option>
                    <option value="low">Düşük</option>
                    <option value="medium">Orta</option>
                    <option value="high">Yüksek</option>
                  </select>
                </div>

                <div className="filter-popover-group">
                  <label>Tarih</label>
                  <select value={filterDueDate} onChange={(e) => setFilterDueDate(e.target.value)}>
                    <option value="all">Tüm Tarihler</option>
                    <option value="today">Bugün</option>
                    <option value="week">Bu Hafta</option>
                    <option value="overdue">Gecikenler</option>
                  </select>
                </div>

                {availableLabelsInBoard.length > 0 && (
                  <div className="filter-popover-group">
                    <label>Etiket</label>
                    <select value={selectedTagFilter} onChange={(e) => setSelectedTagFilter(e.target.value)}>
                      <option value="all">Tüm Etiketler</option>
                      {availableLabelsInBoard.map((lbl) => (
                        <option key={lbl} value={lbl}>#{lbl}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="filter-popover-actions">
                  <button type="button" className="btn-filter-clear" onClick={handleClearAllFilters}>
                    Temizle
                  </button>
                  <button type="button" className="btn-filter-apply" onClick={() => setIsFiltersOpen(false)}>
                    Uygula
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            className={`btn-my-tasks-toggle ${onlyMyTasks ? 'active' : ''}`}
            onClick={() => setOnlyMyTasks(!onlyMyTasks)}
          >
            <UserCheck size={16} />
            <span>{onlyMyTasks ? '✓ Bana Ait Görevler' : 'Bana Ait Görevler'}</span>
          </button>

          {/* Pano işlemleri artık sol araç grubunda. Büyük Yeni Görev butonu kaldırıldı. */}
          <div className="board-options-menu-wrap" ref={boardMenuRef}>
            <button
              type="button"
              className="btn-three-dots-menu"
              onClick={() => setIsBoardMenuOpen(!isBoardMenuOpen)}
              title="Pano İşlemleri"
              aria-label="Pano işlemleri"
              aria-expanded={isBoardMenuOpen}
            >
              <MoreVertical size={18} />
            </button>

            {isBoardMenuOpen && (
              <div className="board-options-dropdown board-options-dropdown-left">
                <button
                  type="button"
                  className="board-dropdown-item"
                  onClick={() => {
                    setIsBoardMenuOpen(false);
                    handleOpenCreateTaskModal();
                  }}
                >
                  <Plus size={15} /> Yeni Görev Oluştur
                </button>

                {isManagerOfCurrentProject && (
                  <button
                    type="button"
                    className="board-dropdown-item"
                    onClick={() => {
                      setIsBoardMenuOpen(false);
                      setShowInviteModal(true);
                    }}
                  >
                    <UserPlus size={15} /> Üye Davet Et
                  </button>
                )}

                <button
                  type="button"
                  className="board-dropdown-item"
                  onClick={() => {
                    setIsBoardMenuOpen(false);
                    setShowStatsModal(true);
                  }}
                >
                  <BarChart3 size={15} /> İstatistikler
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Genel ilerleme toolbar'ın sağında, tek satırda ve kompakt */}
        <div className="compact-progress-widget toolbar-progress-widget">
          <div className="compact-progress-header">
            <span>Genel İlerleme</span>
            <span className="compact-progress-text">
              {tasks.filter((t) => t.columnId === columns[columns.length - 1]?.id).length}/{tasks.length} tamamlandı
            </span>
          </div>
          <div className="compact-progress-bar-bg">
            <div
              className="compact-progress-bar-fill"
              style={{
                width: `${tasks.length > 0 ? (tasks.filter((t) => t.columnId === columns[columns.length - 1]?.id).length / tasks.length) * 100 : 0}%`
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Kanban Sütunları */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="board-scroll-area">
          <Droppable droppableId="all-columns" direction="horizontal" type="column">
            {(provided) => (
              <div className="board" ref={provided.innerRef} {...provided.droppableProps}>
                {columns.length === 0 ? (
                  <div style={{ textAlign: 'center', margin: '40px auto', color: '#cbd5e1' }}>
                    <Kanban size={40} color="#3b82f6" />
                    <h3 style={{ margin: '10px 0' }}>Sütunlar Yükleniyor...</h3>
                    <button
                      type="button"
                      className="btn-save"
                      onClick={() => fetchColumns(activeProjectId)}
                    >
                      <RotateCcw size={16} /> Sütunları Yeniden Yükle
                    </button>
                  </div>
                ) : (
                  columns.map((col, colIndex) => {
                    const colTasks = filteredTasks.filter((t) =>
                      t.columnId ? t.columnId === col.id : columns[0]?.id === col.id
                    );

                    return (
                      <Draggable key={col.id} draggableId={`col-${col.id}`} index={colIndex}>
                        {(colProvided, colSnapshot) => (
                          <div
                            className={`column ${colSnapshot.isDragging ? 'column-dragging' : ''}`}
                            ref={colProvided.innerRef}
                            {...colProvided.draggableProps}
                          >
                            <div
                              className="column-header"
                              style={{ borderTop: `4px solid ${col.color || '#3b82f6'}`, cursor: 'grab' }}
                              {...colProvided.dragHandleProps}
                            >
                              {editingColId === col.id ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
                                  <input
                                    type="text"
                                    maxLength={30}
                                    value={editingColTitle}
                                    onChange={(e) => setEditingColTitle(e.target.value)}
                                    onBlur={() => handleRenameColumn(col.id)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleRenameColumn(col.id);
                                      if (e.key === 'Escape') setEditingColId(null);
                                    }}
                                    autoFocus
                                    style={{
                                      fontSize: '13.5px',
                                      fontWeight: 'bold',
                                      padding: '4px 8px',
                                      borderRadius: '6px',
                                      border: '1.5px solid #3b82f6',
                                      background: 'var(--hover-bg)',
                                      color: 'inherit',
                                      outline: 'none',
                                      flex: 1
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRenameColumn(col.id)}
                                    style={{ background: '#10b981', border: 'none', borderRadius: '6px', color: '#fff', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                                    title="Kaydet"
                                  >
                                    <Check size={15} strokeWidth={2.8} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingColId(null)}
                                    style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', color: '#94a3b8', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                                    title="İptal"
                                  >
                                    <X size={14} strokeWidth={2.2} />
                                  </button>
                                </div>
                              ) : (
                                <div
                                  style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                                  onClick={() => {
                                    if (isManagerOfCurrentProject) {
                                      setEditingColId(col.id);
                                      setEditingColTitle(col.title);
                                    }
                                  }}
                                  title={isManagerOfCurrentProject ? 'Adı değiştirmek için tıkla' : ''}
                                >
                                  <span className="col-title">{col.title}</span>
                                  {isManagerOfCurrentProject && (
                                    <Edit2 size={12} color="#64748b" style={{ opacity: 0.7 }} />
                                  )}
                                </div>
                              )}

                              {editingColId !== col.id && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span className="badge">{colTasks.length}</span>
                                  {isManagerOfCurrentProject && columns.length > 1 && (
                                    <button
                                      style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '2px' }}
                                      title="Sütunu Sil"
                                      onClick={() => handleDeleteColumn(col.id)}
                                    >
                                      <X size={14} />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>

                            <Droppable droppableId={col.id.toString()} type="task">
                              {(taskProvided) => (
                                <div
                                  className="task-list"
                                  ref={taskProvided.innerRef}
                                  {...taskProvided.droppableProps}
                                >
                                  {colTasks.map((task, index) => {
                                    const progress = calculateProgress(task.items);
                                    const compactDue = getCardCompactDueDate(task.dueDate, task.columnId);
                                    const cardTotalItems = task.items ? task.items.length : 0;
                                    const cardDoneItems = task.items ? task.items.filter(i => i.isCompleted).length : 0;

                                    return (
                                      <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                                        {(provided) => (
                                          <div
                                            className="task-card"
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            onClick={() => openEditModal(task)}
                                          >
                                            {/* Üst Satır: Başlık Sol, YÜKSEK Rozeti ve İkonlar Sağ Üstte */}
                                            <div className="task-card-top-row">
                                              <h4>{task.title}</h4>
                                              <div className="task-card-right-group">
                                                <span className={`priority-tag-compact ${task.priority}`}>
                                                  {task.priority === 'low' ? 'DÜŞÜK' : task.priority === 'medium' ? 'ORTA' : 'YÜKSEK'}
                                                </span>
                                                <div className="task-card-actions" onClick={(e) => e.stopPropagation()}>
                                                  <button
                                                    title="Kartı Kopyala"
                                                    onClick={(e) => handleDuplicateTask(task, e)}
                                                  >
                                                    <Copy size={13} />
                                                  </button>
                                                  <button
                                                    title="Kartı Sil"
                                                    onClick={(e) => handleDeleteTask(task.id, e)}
                                                  >
                                                    <Trash2 size={13} />
                                                  </button>
                                                </div>
                                              </div>
                                            </div>

                                            {/* Checklist Kompakt Bilgi */}
                                            {cardTotalItems > 0 && (
                                              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '2px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10.5px', color: '#94a3b8' }}>
                                                  <span>✓ {cardDoneItems}/{cardTotalItems} tamamlandı</span>
                                                </div>
                                                <div className="progress-bar-container" style={{ height: '4px' }}>
                                                  <div className="checklist-progress-fill" style={{ width: `${progress}%` }}></div>
                                                </div>
                                              </div>
                                            )}

                                            {/* Tek Satır Alt Bilgi */}
                                            <div className="task-card-footer-line">
                                              <div className="task-card-meta-left">
                                                {compactDue && (
                                                  <span className={`task-compact-date ${compactDue.className}`} title={compactDue.tooltip}>
                                                    {compactDue.label}
                                                  </span>
                                                )}
                                                {task.assignedTo && (
                                                  <span className="task-compact-assignee" title={task.assignedTo.name || task.assignedTo.email}>
                                                    👤 {task.assignedTo.name || task.assignedTo.email.split('@')[0]}
                                                  </span>
                                                )}
                                              </div>

                                              {task.comments && task.comments.length > 0 && (
                                                <span className="task-compact-comments" title={`${task.comments.length} yorum`}>
                                                  <MessageSquare size={11} /> {task.comments.length}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </Draggable>
                                    );
                                  })}
                                  {taskProvided.placeholder}
                                </div>
                              )}
                            </Droppable>

                            <button
                              type="button"
                              className="btn-column-add-task"
                              onClick={() => handleOpenCreateTaskModal(col.id)}
                            >
                              <Plus size={15} /> Bir kart ekle
                            </button>
                          </div>
                        )}
                      </Draggable>
                    );
                  })
                )}
                {provided.placeholder}

                {isManagerOfCurrentProject && (
                  <div style={{ width: '310px', minWidth: '310px' }}>
                    {showAddColumn ? (
                      <form onSubmit={handleAddColumn} style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(15, 23, 42, 0.85)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <input
                          type="text"
                          placeholder="Liste başlığı..."
                          maxLength={30}
                          value={newColumnTitle}
                          onChange={(e) => setNewColumnTitle(e.target.value)}
                          autoFocus
                          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--hover-bg)', color: 'inherit', outline: 'none' }}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Renk:</span>
                          {['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'].map((c) => (
                            <span
                              key={c}
                              onClick={() => setNewColumnColor(c)}
                              style={{
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                backgroundColor: c,
                                cursor: 'pointer',
                                border: newColumnColor === c ? '2px solid #fff' : 'none'
                              }}
                            />
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                          <button type="submit" className="btn-save" style={{ flex: 1 }}>Ekle</button>
                          <button type="button" onClick={() => setShowAddColumn(false)} className="btn-cancel" style={{ flex: 1 }}>İptal</button>
                        </div>
                      </form>
                    ) : (
                      <button className="btn-add-column-trigger" onClick={() => setShowAddColumn(true)}>
                        <Plus size={16} /> Başka bir liste ekle
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </Droppable>
        </div>
      </DragDropContext>

      {/* Üye Davet Modalı */}
      {showInviteModal && (
        <div className="modal-backdrop" onClick={() => setShowInviteModal(false)}>
          <div className="modal-card modal-card-sm" onClick={(e) => e.stopPropagation()}>
            <div
              className="modal-header"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                position: 'relative'
              }}
            >
              <h3
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  margin: 0,
                  minWidth: 0
                }}
              >
                <UserPlus size={18} /> Panoya Üye Davet Et
              </h3>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowInviteModal(false)}
                aria-label="Davet penceresini kapat"
                style={{
                  position: 'static',
                  flex: '0 0 auto',
                  marginLeft: 'auto'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleInviteMember} className="modal-form">
              <label>Kullanıcı E-Posta Adresi</label>
              <input
                type="email"
                placeholder="E-posta adresinizi girin"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                autoFocus
              />

              <label>Pano Rolü</label>
              <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                <option value="DEVELOPER">💻 Geliştirici (Görev alabilir, düzenleyebilir)</option>
                <option value="MANAGER">👑 Yönetici (Tam yetkili)</option>
              </select>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  width: '100%',
                  marginTop: '8px'
                }}
              >
                <button
                  type="submit"
                  className="btn-save"
                  style={{
                    position: 'static',
                    width: 'auto',
                    minWidth: '132px',
                    margin: 0,
                    padding: '10px 18px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Davet Et
                </button>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>MEVCUT PANO ÜYELERİ</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                  {projectMembers.map((m) => (
                    <div key={m.id} className="member-invite-item">
                      <div style={{ textAlign: 'left' }}>
                        <strong style={{ fontSize: '12px' }}>{m.user?.name || m.user?.email}</strong>
                        <small style={{ display: 'block', fontSize: '10px', color: '#64748b' }}>
                          {m.role === 'MANAGER' ? '👑 Yönetici' : '💻 Geliştirici'}
                        </small>
                      </div>
                      {m.userId !== currentUser?.id && isManagerOfCurrentProject && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(m.userId)}
                          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                          title="Üyeyi Çıkar"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pano Analitiği Modalı */}
      {showStatsModal && (
        <div className="modal-backdrop" onClick={() => setShowStatsModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><BarChart3 size={18} /> Pano Analitiği & İstatistikler</h3>
              <button className="btn-close" onClick={() => setShowStatsModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '20px', textAlign: 'left' }}>
              <div className="stats-grid">
                <div className="stat-box">
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Toplam Kart</span>
                  <strong style={{ color: '#3b82f6' }}>{tasks.length}</strong>
                </div>
                <div className="stat-box">
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Tamamlanan</span>
                  <strong style={{ color: '#10b981' }}>
                    {tasks.filter((t) => t.columnId === columns[columns.length - 1]?.id).length}
                  </strong>
                </div>
                <div className="stat-box">
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Yüksek Öncelikli</span>
                  <strong style={{ color: '#ef4444' }}>
                    {tasks.filter((t) => t.priority === 'high').length}
                  </strong>
                </div>
                <div className="stat-box">
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Pano Üyesi</span>
                  <strong style={{ color: '#8b5cf6' }}>{projectMembers.length}</strong>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Üye Başına Görev Dağılımı</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                  {projectMembers.map((m) => {
                    const memberTasksCount = tasks.filter((t) => t.assignedToId === m.userId).length;
                    return (
                      <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', background: 'var(--hover-bg)', padding: '6px 12px', borderRadius: '6px' }}>
                        <span>👤 {m.user?.name || m.user?.email}</span>
                        <strong>{memberTasksCount} Görev</strong>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Yeni Kart Modalı */}
      {showCreateTaskModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateTaskModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><Plus size={18} /> Yeni Görev Kartı Ekle</h3>
              <button className="btn-close" onClick={() => setShowCreateTaskModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveNewTask} className="modal-form">
              <label>Kart Başlığı *</label>
              <input
                type="text"
                placeholder="Görev adı..."
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
                required
                autoFocus
              />

              <label>Açıklama</label>
              <div className="description-attachment-box">
                <textarea
                  className="description-attachment-textarea"
                  placeholder="Görev detayları..."
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                />
                {createAttachments.length > 0 && (
                  <div className="description-attachment-list">
                    {createAttachments.map((file, index) => (
                      <div className="description-attachment-item" key={`${file.name}-${file.size}-${index}`}>
                        <FileText size={15} />
                        <button type="button" className="attachment-name-static" title={file.name}>{file.name}</button>
                        <span>{formatAttachmentSize(file.size)}</span>
                        <button type="button" className="attachment-remove-btn" onClick={() => setCreateAttachments(prev => prev.filter((_, i) => i !== index))} title="Dosyayı kaldır">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="description-attachment-toolbar">
                  <input ref={createAttachmentInputRef} type="file" multiple accept={ACCEPTED_ATTACHMENT_EXTENSIONS} hidden onChange={(e) => { validateAndAddFiles(e.target.files, createAttachments, setCreateAttachments); e.target.value = ''; }} />
                  <button type="button" className="description-add-file-btn" onClick={() => createAttachmentInputRef.current?.click()}>
                    <Paperclip size={15} /> Dosya Ekle
                  </button>
                  <small>En fazla 5 dosya · 10 MB/dosya</small>
                </div>
              </div>

              <div className="modal-row">
                <div>
                  <label>Liste</label>
                  <select value={createTaskColId} onChange={(e) => setCreateTaskColId(e.target.value)}>
                    {columns.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Öncelik</label>
                  <select value={createPriority} onChange={(e) => setCreatePriority(e.target.value)}>
                    <option value="low">Düşük</option>
                    <option value="medium">Orta</option>
                    <option value="high">Yüksek</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <User size={13} /> Sorumlu Kişi
                </label>
                <select value={createAssignedToId} onChange={(e) => setCreateAssignedToId(e.target.value)}>
                  <option value="">(Atanmamış)</option>
                  <option value={currentUser?.id}>👤 Kendim ({currentUser?.name || currentUser?.email})</option>
                  {projectMembers.filter((m) => m.userId !== currentUser?.id).map((m) => (
                    <option key={m.user.id} value={m.user.id}>{m.user.name || m.user.email}</option>
                  ))}
                </select>
              </div>

              <div className="modal-row">
                <div>
                  <label>Başlangıç Tarihi</label>
                  <input type="date" value={createStartDate} onChange={(e) => setCreateStartDate(e.target.value)} />
                </div>
                <div>
                  <label>Bitiş Tarihi</label>
                  <input type="date" value={createDueDate} onChange={(e) => setCreateDueDate(e.target.value)} />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowCreateTaskModal(false)}>İptal</button>
                <button type="submit" className="btn-save">Oluştur</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📋 Kart Düzenleme Modalı */}
      {activeTask && (() => {
        const isTitleChanged = editTitle.trim() !== activeTask.title;
        const isDescChanged = (editDesc.trim() || '') !== (activeTask.description || '');
        const isPriorityChanged = editPriority !== activeTask.priority;
        const isStartChanged = editStartDate !== (activeTask.startDate || '');
        const isDueChanged = editDueDate !== (activeTask.dueDate || '');
        const isColChanged = parseInt(editColumnId) !== activeTask.columnId;
        const isAssigneeChanged = (editAssignedToId ? parseInt(editAssignedToId) : null) !== (activeTask.assignedToId || null);

        const hasChanges = isTitleChanged || isDescChanged || isPriorityChanged || isStartChanged || isDueChanged || isColChanged || isAssigneeChanged || editAttachments.length > 0;
        const isSaveDisabled = !editTitle.trim() || !hasChanges;
        
        const checklistTotal = activeTask.items ? activeTask.items.length : 0;
        const checklistDone = activeTask.items ? activeTask.items.filter(i => i.isCompleted).length : 0;
        const checklistProg = calculateProgress(activeTask.items);

        const handleTryCloseModal = () => {
          if (hasChanges) {
            if (window.confirm('Kaydedilmemiş değişiklikleriniz var. Çıkmak istiyor musunuz?')) {
              setActiveTask(null);
            }
          } else {
            setActiveTask(null);
          }
        };

        return (
          <div className="modal-backdrop" onClick={handleTryCloseModal}>
            <div className="task-edit-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="task-edit-modal-header">
                <h3><Edit2 size={18} color="#38bdf8" /> Kartı Düzenle</h3>
                <button
                  type="button"
                  className="btn-modal-close-absolute"
                  onClick={handleTryCloseModal}
                  title="Kapat"
                >
                  <X size={18} strokeWidth={2.4} />
                </button>
              </div>

              <div className="task-edit-modal-body">
                {/* Başlık */}
                <div className="form-group-block">
                  <label>Kart Başlığı *</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                    placeholder="Kart başlığı yazın..."
                  />
                </div>

                {/* Açıklama */}
                <div className="form-group-block">
                  <label>Açıklama</label>
                  <div className="description-attachment-box edit-description-attachment-box">
                    <textarea
                      className="description-attachment-textarea"
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      placeholder="Bu görev hakkında detayları yazın..."
                    />
                    {(activeTask.attachments || []).length > 0 && (
                      <div className="description-attachment-list">
                        {(activeTask.attachments || []).map((attachment) => (
                          <div className="description-attachment-item" key={attachment.id}>
                            <FileText size={15} />
                            <button type="button" className="attachment-open-btn" onClick={() => handleDownloadAttachment(attachment)} title="Dosyayı aç">
                              {attachment.originalName}
                            </button>
                            <span>{formatAttachmentSize(attachment.size)}</span>
                            <button type="button" className="attachment-download-btn" onClick={() => handleDownloadAttachment(attachment)} title="Dosyayı aç/indir"><Download size={14} /></button>
                            <button type="button" className="attachment-remove-btn" onClick={() => handleDeleteAttachment(attachment.id)} title="Dosyayı kaldır"><X size={14} /></button>
                          </div>
                        ))}
                      </div>
                    )}
                    {editAttachments.length > 0 && (
                      <div className="description-attachment-list pending-attachment-list">
                        {editAttachments.map((file, index) => (
                          <div className="description-attachment-item pending" key={`${file.name}-${file.size}-${index}`}>
                            <FileText size={15} />
                            <button type="button" className="attachment-name-static" title={file.name}>{file.name}</button>
                            <span>{formatAttachmentSize(file.size)}</span>
                            <button type="button" className="attachment-remove-btn" onClick={() => setEditAttachments(prev => prev.filter((_, i) => i !== index))} title="Seçimi kaldır"><X size={14} /></button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="description-attachment-toolbar">
                      <input ref={editAttachmentInputRef} type="file" multiple accept={ACCEPTED_ATTACHMENT_EXTENSIONS} hidden onChange={(e) => { validateAndAddFiles(e.target.files, editAttachments, setEditAttachments); e.target.value = ''; }} />
                      <button type="button" className="description-add-file-btn" onClick={() => editAttachmentInputRef.current?.click()}>
                        <Paperclip size={15} /> Dosya Ekle
                      </button>
                      <small>En fazla 5 yeni dosya · 10 MB/dosya</small>
                    </div>
                  </div>
                </div>

                {/* Liste + Öncelik + Sorumlu */}
                <div className="form-row-3">
                  <div className="form-group-block">
                    <label>Bulunduğu Liste</label>
                    <select value={editColumnId} onChange={(e) => setEditColumnId(e.target.value)}>
                      {columns.map((c) => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group-block">
                    <label>Öncelik</label>
                    <select value={editPriority} onChange={(e) => setEditPriority(e.target.value)}>
                      <option value="low">Düşük</option>
                      <option value="medium">Orta</option>
                      <option value="high">Yüksek</option>
                    </select>
                  </div>

                  <div className="form-group-block">
                    <label>Sorumlu Kişi</label>
                    <select value={editAssignedToId} onChange={(e) => setEditAssignedToId(e.target.value)}>
                      <option value="">(Atanmamış)</option>
                      <option value={currentUser?.id}>👤 Kendim</option>
                      {projectMembers.filter((m) => m.userId !== currentUser?.id).map((m) => (
                        <option key={m.user.id} value={m.user.id}>{m.user.name || m.user.email}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Tarihler */}
                <div className="form-row-2">
                  <div className="form-group-block">
                    <label><Calendar size={13} /> Başlangıç Tarihi</label>
                    <input type="date" value={editStartDate} onChange={(e) => setEditStartDate(e.target.value)} />
                  </div>
                  <div className="form-group-block">
                    <label><Calendar size={13} /> Bitiş (Teslim) Tarihi</label>
                    <input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} />
                  </div>
                </div>

                {editStartDate && editDueDate && new Date(editStartDate) > new Date(editDueDate) && (
                  <span style={{ fontSize: '11px', color: '#f87171', fontWeight: 600, marginTop: '-10px' }}>
                    ⚠️ Başlangıç tarihi bitiş tarihinden sonra olamaz.
                  </span>
                )}

                {/* Etiketler */}
                <div className="form-group-block" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
                  <label><Tag size={13} /> Etiketler</label>
                  
                  {activeTask.labels && activeTask.labels.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                      {activeTask.labels.map((lbl) => (
                        <span
                          key={lbl.id}
                          className="card-label-badge"
                          style={{ backgroundColor: lbl.color, display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '8px' }}
                        >
                          {lbl.text}
                          <button
                            type="button"
                            onClick={() => handleDeleteLabel(lbl.id)}
                            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: 0, display: 'flex' }}
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '8px' }}>
                    {LABEL_COLORS.map((c) => (
                      <span
                        key={c}
                        onClick={() => setSelectedLabelColor(c)}
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: c,
                          cursor: 'pointer',
                          border: selectedLabelColor === c ? '2px solid #ffffff' : 'none',
                          boxShadow: selectedLabelColor === c ? '0 0 0 2px #2563eb' : 'none'
                        }}
                      />
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Etiket adı (Örn. Frontend)..."
                      value={newLabelText}
                      onChange={(e) => setNewLabelText(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button type="button" onClick={handleAddLabel} className="btn-secondary-action">
                      <Plus size={14} /> Ekle
                    </button>
                  </div>
                </div>

                {/* Checklist */}
                <div className="form-group-block" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                      <CheckSquare size={14} /> Checklist
                    </label>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#38bdf8' }}>
                      {checklistTotal > 0 ? `${checklistDone}/${checklistTotal} tamamlandı` : '0 görev'}
                    </span>
                  </div>

                  {checklistTotal > 0 && (
                    <div className="progress-bar-container" style={{ height: '6px', marginBottom: '10px' }}>
                      <div className="checklist-progress-fill" style={{ width: `${checklistProg}%` }}></div>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                    {activeTask.items && activeTask.items.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          background: 'var(--hover-bg)',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)'
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleChecklistItem(item.id, item.isCompleted)}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex' }}
                        >
                          {item.isCompleted ? <CheckSquare size={16} color="#10b981" /> : <Square size={16} color="#64748b" />}
                        </button>
                        <span style={{ flex: 1, fontSize: '13px', textDecoration: item.isCompleted ? 'line-through' : 'none', opacity: item.isCompleted ? 0.6 : 1 }}>
                          {item.title}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteChecklistItem(item.id)}
                          style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Yeni alt görev..."
                      value={newChecklistText}
                      onChange={(e) => setNewChecklistText(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button type="button" onClick={handleAddChecklistItem} className="btn-secondary-action">
                      <Plus size={14} /> Ekle
                    </button>
                  </div>
                </div>

                {/* Yorumlar */}
                <div className="form-group-block" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <MessageSquare size={14} /> Yorumlar & Notlar
                  </label>

                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <input
                      type="text"
                      placeholder="Bir yorum veya not yazın..."
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button type="button" onClick={handleAddComment} className="btn-secondary-action">
                      <Send size={14} /> Gönder
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                    {activeTask.comments && activeTask.comments.length > 0 ? (
                      activeTask.comments.map((comment) => {
                        const canDeleteComment = isManagerOfCurrentProject || currentUser?.id === comment.user.id;
                        return (
                          <div key={comment.id} className="comment-bubble-item">
                            <div className="comment-bubble-top">
                              <div className="comment-author-info">
                                <div className="comment-avatar">
                                  {(comment.user.name || comment.user.email)[0].toUpperCase()}
                                </div>
                                <strong style={{ fontSize: '12px', color: '#f8fafc' }}>
                                  {comment.user.name || comment.user.email.split('@')[0]}
                                </strong>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '10.5px', color: '#64748b' }}>
                                  {formatCommentDate(comment.createdAt)}
                                </span>
                                {canDeleteComment && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteComment(comment.id)}
                                    className="comment-delete-btn"
                                    title="Yorumu Sil"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                            </div>
                            <p style={{ margin: '2px 0 0 32px', fontSize: '12.5px', color: '#cbd5e1', lineHeight: '1.4' }}>
                              {comment.text}
                            </p>
                          </div>
                        );
                      })
                    ) : (
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Henüz yorum yapılmamış.</span>
                    )}
                  </div>
                </div>

                {/* Aktivite Geçmişi */}
                <div className="form-group-block" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <History size={14} /> Aktivite Geçmişi
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '120px', overflowY: 'auto' }}>
                    {activeTask.activities && activeTask.activities.length > 0 ? (
                      activeTask.activities.map((act) => (
                        <div key={act.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: '#94a3b8' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#38bdf8', flexShrink: 0 }}></span>
                          <span>
                            <strong style={{ color: '#f8fafc', fontWeight: 'bold' }}>
                              {act.user.name || act.user.email}
                            </strong>{' '}
                            <span style={{ fontWeight: 'normal' }}>{act.action.toLowerCase()}</span>
                          </span>
                          <small style={{ marginLeft: 'auto', fontSize: '10px' }}>
                            {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </small>
                        </div>
                      ))
                    ) : (
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Henüz bir hareket kaydı yok.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Alt Butonlar */}
              <div className="task-edit-footer-actions">
                <button
                  type="button"
                  className="btn-modal-cancel-custom"
                  onClick={handleTryCloseModal}
                >
                  İptal
                </button>
                <button
                  type="button"
                  className={`btn-modal-save-gradient ${hasChanges ? 'active-changes' : ''}`}
                  disabled={isSaveDisabled}
                  onClick={handleSaveEdit}
                >
                  <Save size={16} /> Değişiklikleri Kaydet
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Ekip Sohbeti */}
      <div className="board-chat-dock-wrapper">
        {!isChatOpen ? (
          <button
            className="btn-chat-trigger-modern"
            onClick={() => {
              fetchAllUsers();
              setIsChatOpen(true);
            }}
          >
            <MessageSquareText size={20} />
            <span>Ekip Sohbeti</span>
            {totalUnreadMessages > 0 && (
              <span
                style={{
                  minWidth: '20px',
                  height: '20px',
                  padding: '0 6px',
                  borderRadius: '999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#ef4444',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 800,
                  lineHeight: 1
                }}
              >
                {totalUnreadMessages > 99 ? '99+' : totalUnreadMessages}
              </span>
            )}
          </button>
        ) : (
          <div className="board-chat-dock-panel" ref={chatDockRef}>
            <div className="chat-dock-header">
              {selectedChatUser ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedChatUser(null)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <strong style={{ fontSize: '12px' }}>{selectedChatUser.name || selectedChatUser.email}</strong>
                </div>
              ) : (
                <div className="chat-dock-title-wrap">
                  <MessageSquareText size={18} />
                  <strong>Ekip Sohbeti</strong>
                </div>
              )}
              <button
                type="button"
                className="btn-dock-close"
                onClick={() => {
                  setIsChatOpen(false);
                  setSelectedChatUser(null);
                  setChatSearchUser('');
                }}
              >
                <X size={16} />
              </button>
            </div>

            {!selectedChatUser ? (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div className="chat-dock-search">
                  <Search size={14} className="search-dock-icon" />
                  <input
                    type="text"
                    placeholder="Kişi ara..."
                    value={chatSearchUser}
                    onChange={(e) => setChatSearchUser(e.target.value)}
                  />
                </div>

                <div className="chat-dock-list">
                  {allUsersList
                    .filter((u) => u.name?.toLowerCase().includes(chatSearchUser.toLowerCase()) || u.email.toLowerCase().includes(chatSearchUser.toLowerCase()))
                    .map((u) => (
                      <div
                        key={u.id}
                        className="chat-dock-user-item"
                        onClick={() => {
                          setSelectedChatUser(u);
                          setUnreadMessageCounts((prev) => ({ ...prev, [u.id]: 0 }));
                        }}
                      >
                        <div className="avatar-circle-dock">
                          {(u.name || u.email)[0].toUpperCase()}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', flex: 1, minWidth: 0 }}>
                          <strong style={{ fontSize: '12px' }}>{u.name || u.email.split('@')[0]}</strong>
                          <small style={{ fontSize: '10px', color: '#64748b' }}>{u.email}</small>
                        </div>
                        {(unreadMessageCounts[u.id] || 0) > 0 && (
                          <span
                            style={{
                              minWidth: '20px',
                              height: '20px',
                              padding: '0 6px',
                              borderRadius: '999px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: '#ef4444',
                              color: '#fff',
                              fontSize: '10px',
                              fontWeight: 800,
                              marginLeft: 'auto'
                            }}
                          >
                            {unreadMessageCounts[u.id] > 99 ? '99+' : unreadMessageCounts[u.id]}
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div
                className="chat-dock-conversation"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flex: '1 1 0',
                  height: 0,
                  minHeight: 0,
                  overflow: 'hidden'
                }}
              >
                <div
                  className="chat-dock-messages"
                  style={{
                    flex: '1 1 0',
                    height: 0,
                    minHeight: 0,
                    padding: '12px',
                    overflowY: 'scroll',
                    overflowX: 'hidden',
                    scrollbarGutter: 'stable',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  {directMessages.map((msg) => {
                    const isMe = msg.senderId === currentUser?.id;
                    return (
                      <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                        <div style={{
                          maxWidth: '78%',
                          padding: '8px 12px',
                          borderRadius: '12px',
                          background: isMe ? '#2563eb' : 'var(--hover-bg)',
                          color: isMe ? '#ffffff' : 'var(--text-main)',
                          textAlign: 'left'
                        }}>
                          <p style={{ margin: 0, fontSize: '12px' }}>{msg.text}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>

                <form
                  onSubmit={handleSendDirectMessage}
                  className="chat-dock-compose"
                  style={{
                    flex: '0 0 64px',
                    minHeight: '64px',
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '10px 12px',
                    margin: 0,
                    borderTop: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'var(--panel-bg)',
                    zIndex: 5
                  }}
                >
                  <input
                    type="text"
                    placeholder="Mesaj yazın..."
                    value={dmInputText}
                    onChange={(e) => setDmInputText(e.target.value)}
                    className="chat-dock-message-input"
                    style={{ flex: 1, minWidth: 0, height: '42px', padding: '0 14px', borderRadius: '20px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--hover-bg)', color: 'var(--text-main)' }}
                  />
                  <button type="submit" className="chat-dock-send" disabled={!dmInputText.trim()} aria-label="Mesaj gönder">
                    <Send size={15} />
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;