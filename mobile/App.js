import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Defs, LinearGradient, Stop, Rect, G, Circle, Path as SvgPath } from "react-native-svg";
import { Eye, EyeOff } from "lucide-react-native";

/*
  ============================================================
  PANOVIO MOBILE
  ============================================================

  Bilgisayar ve telefon aynı Wi-Fi ağında olmalı.

  Bilgisayarın yerel IP adresi değişirse aşağıdaki
  192.168.1.21 adresini yeni IPv4 adresinle değiştir.
*/

const API_URL =
  Platform.OS === "web"
    ? "http://localhost:5000/api"
    : "http://192.168.1.21:5000/api";

/*
  ============================================================
  TEMA
  ============================================================
*/

const DARK = {
  background: "#080d1a",
  background2: "#071A30",
  surface: "#0B2037",
  surface2: "#0D223B",
  surface3: "#102A46",

  border: "#1D4265",
  borderSoft: "#183D5D",

  text: "#F8FAFC",
  text2: "#CBD5E1",
  muted: "#94A3B8",
  muted2: "#64748B",

  primary: "#0EA5E9",
  primary2: "#38BDF8",

  danger: "#EF4444",
  success: "#10B981",
  warning: "#F59E0B",
};

const LIGHT = {
  background: "#F1F5F9",
  background2: "#FFFFFF",
  surface: "#FFFFFF",
  surface2: "#F8FAFC",
  surface3: "#EFF6FF",

  border: "#D7E2EE",
  borderSoft: "#E2E8F0",

  text: "#0F172A",
  text2: "#334155",
  muted: "#64748B",
  muted2: "#94A3B8",

  primary: "#0284C7",
  primary2: "#0EA5E9",

  danger: "#DC2626",
  success: "#059669",
  warning: "#D97706",
};

/*
  ============================================================
  PANO RENKLERİ

  Kullanıcının HEX kodu bilmesine gerek yok.
  Renge dokunarak seçim yapacak.
  ============================================================
*/

const BOARD_COLORS = [
  {
    name: "Okyanus",
    value: "#0369A1",
  },
  {
    name: "Gökyüzü",
    value: "#0EA5E9",
  },
  {
    name: "Lacivert",
    value: "#1E3A8A",
  },
  {
    name: "Mor",
    value: "#7C3AED",
  },
  {
    name: "Lavanta",
    value: "#8B5CF6",
  },
  {
    name: "Turkuaz",
    value: "#0F766E",
  },
  {
    name: "Zümrüt",
    value: "#059669",
  },
  {
    name: "Yeşil",
    value: "#16A34A",
  },
  {
    name: "Turuncu",
    value: "#EA580C",
  },
  {
    name: "Amber",
    value: "#D97706",
  },
  {
    name: "Gül",
    value: "#E11D48",
  },
  {
    name: "Pembe",
    value: "#DB2777",
  },
  {
    name: "Gece",
    value: "#0F172A",
  },
  {
    name: "Grafit",
    value: "#334155",
  },
];

/*
  ============================================================
  ETİKET RENKLERİ
  ============================================================
*/

const LABEL_COLORS = [
  "#0EA5E9",
  "#2563EB",
  "#7C3AED",
  "#EC4899",
  "#EF4444",
  "#F59E0B",
  "#10B981",
  "#14B8A6",
];

/*
  ============================================================
  YARDIMCI FONKSİYONLAR
  ============================================================
*/

const getInitials = (name = "") => {
  const pieces = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!pieces.length) {
    return "?";
  }

  return pieces
    .slice(0, 2)
    .map((piece) => piece[0]?.toUpperCase())
    .join("");
};

const normalizePriority = (priority) => {
  const value = String(priority || "medium").toLowerCase();

  if (value === "high") return "high";
  if (value === "low") return "low";

  return "medium";
};

const getPriorityLabel = (priority) => {
  const value = normalizePriority(priority);

  if (value === "high") return "Yüksek";
  if (value === "low") return "Düşük";

  return "Orta";
};

const getPriorityColor = (priority) => {
  const value = normalizePriority(priority);

  if (value === "high") return "#EF4444";
  if (value === "low") return "#10B981";

  return "#F59E0B";
};

const formatDate = (date) => {
  if (!date) {
    return "Tarih yok";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return String(date).slice(0, 10);
  }

  return parsed.toLocaleDateString("tr-TR");
};

/*
  Kullanıcı tarih alanına:

  18.09.2026
  veya
  2026-09-18

  yazabilir.

  Backend'e YYYY-MM-DD gönderiyoruz.
*/

const normalizeDateInput = (value) => {
  const text = String(value || "").trim();

  if (!text) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  const match = text.match(
    /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/
  );

  if (!match) {
    return null;
  }

  const day = match[1].padStart(2, "0");
  const month = match[2].padStart(2, "0");
  const year = match[3];

  return `${year}-${month}-${day}`;
};

const getTodayStart = () => {
  const now = new Date();

  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
};

const getTodayEnd = () => {
  const date = getTodayStart();

  date.setHours(23, 59, 59, 999);

  return date;
};

const isToday = (value) => {
  if (!value) return false;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const today = getTodayStart();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
};

const isThisWeek = (value) => {
  if (!value) return false;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const start = getTodayStart();
  const end = new Date(start);

  end.setDate(end.getDate() + 7);
  end.setHours(23, 59, 59, 999);

  return date >= start && date <= end;
};

const isOverdue = (task) => {
  if (!task?.dueDate) {
    return false;
  }

  const date = new Date(task.dueDate);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return date < getTodayStart();
};

const calculateChecklistProgress = (items = []) => {
  if (!items.length) {
    return 0;
  }

  const completed = items.filter(
    (item) => item.isCompleted
  ).length;

  return Math.round(
    (completed / items.length) * 100
  );
};

const getFileSize = (size) => {
  const bytes = Number(size || 0);

  if (!bytes) {
    return "";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
};

/*
  ============================================================
  KÜÇÜK ARAYÜZ BİLEŞENLERİ
  ============================================================
*/

function PanovioLogoBadge({ size = 48, showText = true, textColor = "#F8FAFC" }) {
  return (
    <View style={styles.logoRow}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Defs>
            <LinearGradient id="pvBg" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#38bdf8" />
              <Stop offset="0.5" stopColor="#2563eb" />
              <Stop offset="1" stopColor="#8b5cf6" />
            </LinearGradient>
            <LinearGradient id="pvCardLeft" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#f8fafc" />
              <Stop offset="1" stopColor="#cbd5e1" />
            </LinearGradient>
            <LinearGradient id="pvCardMid" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#a855f7" />
              <Stop offset="1" stopColor="#6366f1" />
            </LinearGradient>
            <LinearGradient id="pvCardRight" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#38bdf8" />
              <Stop offset="1" stopColor="#06b6d4" />
            </LinearGradient>
            <LinearGradient id="pvWave" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#2563eb" stopOpacity="0.8" />
              <Stop offset="1" stopColor="#9333ea" />
            </LinearGradient>
          </Defs>
          <Rect width="100" height="100" rx="26" fill="url(#pvBg)" />
          <Rect x="2" y="2" width="96" height="96" rx="24" fill="#0b1329" fillOpacity="0.45" />
          <G rotation="-6" origin="28,52">
            <Rect x="18" y="26" width="18" height="48" rx="5" fill="url(#pvCardLeft)" />
            <Rect x="22" y="38" width="10" height="3.5" rx="1.75" fill="#94a3b8" />
            <Rect x="22" y="46" width="10" height="3.5" rx="1.75" fill="#94a3b8" />
          </G>
          <G rotation="3" origin="50,48">
            <Rect x="41" y="20" width="20" height="54" rx="5.5" fill="url(#pvCardMid)" />
            <Circle cx="48" cy="34" r="2.5" fill="#ffffff" fillOpacity="0.9" />
            <Circle cx="55" cy="34" r="2.5" fill="#ffffff" fillOpacity="0.9" />
          </G>
          <G rotation="8" origin="72,48">
            <Rect x="63" y="22" width="19" height="50" rx="5" fill="url(#pvCardRight)" />
            <Rect x="67" y="34" width="11" height="5" rx="2.5" fill="#ffffff" fillOpacity="0.85" />
          </G>
          <SvgPath d="M55 100 C70 80, 85 75, 100 82 L100 100 Z" fill="url(#pvWave)" />
        </Svg>
      </View>
      {showText && (
        <Text style={[styles.logoText, { fontSize: size * 0.58, color: textColor }]}>
          Pano<Text style={styles.logoVio}>vio</Text>
        </Text>
      )}
    </View>
  );
}

function PanovioLogo({ compact = false, textColor = "#F8FAFC" }) {
  return <PanovioLogoBadge size={compact ? 36 : 54} showText textColor={textColor} />;
}

function Avatar({
  name,
  size = 38,
  backgroundColor = "#1E40AF",
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          color: "#FFFFFF",
          fontWeight: "900",
          fontSize: Math.max(11, size * 0.32),
        }}
      >
        {getInitials(name)}
      </Text>
    </View>
  );
}

function PriorityBadge({
  priority,
  compact = false,
}) {
  const color = getPriorityColor(priority);

  return (
    <View
      style={[
        styles.priorityBadge,
        {
          borderColor: color,
          backgroundColor: `${color}20`,
        },
        compact && styles.priorityBadgeCompact,
      ]}
    >
      <View
        style={[
          styles.priorityDot,
          {
            backgroundColor: color,
          },
        ]}
      />

      <Text
        style={[
          styles.priorityBadgeText,
          {
            color,
          },
        ]}
      >
        {getPriorityLabel(priority)}
      </Text>
    </View>
  );
}

function EmptyState({
  icon = "📋",
  title,
  description,
  buttonText,
  onPress,
  theme,
}) {
  return (
    <View
      style={[
        styles.emptyState,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}
    >
      <Text style={styles.emptyStateIcon}>
        {icon}
      </Text>

      <Text
        style={[
          styles.emptyStateTitle,
          {
            color: theme.text,
          },
        ]}
      >
        {title}
      </Text>

      {!!description && (
        <Text
          style={[
            styles.emptyStateDescription,
            {
              color: theme.muted,
            },
          ]}
        >
          {description}
        </Text>
      )}

      {!!buttonText && !!onPress && (
        <TouchableOpacity
          style={[
            styles.emptyStateButton,
            {
              backgroundColor: theme.primary,
            },
          ]}
          onPress={onPress}
        >
          <Text style={styles.emptyStateButtonText}>
            {buttonText}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/*
  ============================================================
  ANA UYGULAMA
  ============================================================
*/

export default function App() {
  /*
    ----------------------------------------------------------
    UYGULAMA / TEMA
    ----------------------------------------------------------
  */

  const [isDark, setIsDark] =
    useState(true);

  const theme = isDark
    ? DARK
    : LIGHT;

  const [appLoading, setAppLoading] =
    useState(true);

  const [loading, setLoading] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  const [
    currentScreen,
    setCurrentScreen,
  ] = useState("boards");

  // Sohbet yazma alanının Android sistem tuşları ve klavye ile çakışmaması için.
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      "keyboardDidShow",
      () => setKeyboardVisible(true)
    );

    const hideSubscription = Keyboard.addListener(
      "keyboardDidHide",
      () => setKeyboardVisible(false)
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  /*
    ----------------------------------------------------------
    AUTH
    ----------------------------------------------------------
  */

  const [token, setToken] =
    useState("");

  const [user, setUser] =
    useState(null);

  const [
    isLoginMode,
    setIsLoginMode,
  ] = useState(true);

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    authMessage,
    setAuthMessage,
  ] = useState("");

  // Şifre alanlarını kullanıcı isterse görünür yapabilir.
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Şifremi unuttum akışı: e-posta -> 6 haneli kod -> yeni şifre.
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotCode, setForgotCode] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  /*
    ----------------------------------------------------------
    PANO
    ----------------------------------------------------------
  */

  const [projects, setProjects] =
    useState([]);

  const [
    activeProjectId,
    setActiveProjectId,
  ] = useState(null);

  const [columns, setColumns] =
    useState([]);

  const [tasks, setTasks] =
    useState([]);

  const [members, setMembers] =
    useState([]);

  /*
    ----------------------------------------------------------
    ARAMA / FİLTRE
    ----------------------------------------------------------
  */

  const [
    searchText,
    setSearchText,
  ] = useState("");

  const [onlyMine, setOnlyMine] =
    useState(false);

  const [
    priorityFilter,
    setPriorityFilter,
  ] = useState("all");

  /*
    Tarih filtreleri:

    all
    today
    week
    overdue
    noDate
  */

  const [
    dateFilter,
    setDateFilter,
  ] = useState("all");

  const [
    showFilters,
    setShowFilters,
  ] = useState(false);

  /*
    ----------------------------------------------------------
    PANO MODALLARI
    ----------------------------------------------------------
  */

  const [
    showCreateProject,
    setShowCreateProject,
  ] = useState(false);

  const [
    showBoardMenu,
    setShowBoardMenu,
  ] = useState(false);

  const [
    showEditBoard,
    setShowEditBoard,
  ] = useState(false);

  const [
    projectTitle,
    setProjectTitle,
  ] = useState("");

  const [
    projectColor,
    setProjectColor,
  ] = useState(
    BOARD_COLORS[1].value
  );

  const [
    editBoardTitle,
    setEditBoardTitle,
  ] = useState("");

  const [
    editBoardColor,
    setEditBoardColor,
  ] = useState(
    BOARD_COLORS[1].value
  );

  /*
    ----------------------------------------------------------
    SÜTUN MODALLARI
    ----------------------------------------------------------
  */

  const [
    showCreateColumn,
    setShowCreateColumn,
  ] = useState(false);

  const [
    showColumnMenu,
    setShowColumnMenu,
  ] = useState(false);

  const [
    selectedColumn,
    setSelectedColumn,
  ] = useState(null);

  const [
    columnTitle,
    setColumnTitle,
  ] = useState("");

  const [
    editColumnTitle,
    setEditColumnTitle,
  ] = useState("");

  /*
    ----------------------------------------------------------
    GÖREV OLUŞTURMA / DÜZENLEME
    ----------------------------------------------------------
  */

  const [
    showCreateTask,
    setShowCreateTask,
  ] = useState(false);

  const [
    selectedTask,
    setSelectedTask,
  ] = useState(null);

  const [
    showEditTask,
    setShowEditTask,
  ] = useState(false);

  const [
    taskTitle,
    setTaskTitle,
  ] = useState("");

  const [
    taskDescription,
    setTaskDescription,
  ] = useState("");

  const [
    taskPriority,
    setTaskPriority,
  ] = useState("medium");

  const [
    taskColumnId,
    setTaskColumnId,
  ] = useState("");

  const [
    taskAssignedToId,
    setTaskAssignedToId,
  ] = useState("");

  const [
    taskStartDate,
    setTaskStartDate,
  ] = useState("");

  const [
    taskDueDate,
    setTaskDueDate,
  ] = useState("");

  /*
    Dosya seçildiğinde burada tutulacak.

    Dosya seçici paketini sonraki bölümde
    güvenli şekilde bağlayacağız.
  */

  const [
    pendingAttachments,
    setPendingAttachments,
  ] = useState([]);

  /*
    ----------------------------------------------------------
    CHECKLIST / ETİKET / YORUM
    ----------------------------------------------------------
  */

  const [
    checklistText,
    setChecklistText,
  ] = useState("");

  const [
    labelText,
    setLabelText,
  ] = useState("");

  const [
    labelColor,
    setLabelColor,
  ] = useState(
    LABEL_COLORS[0]
  );

  const [
    commentText,
    setCommentText,
  ] = useState("");

  /*
    ----------------------------------------------------------
    ÜYE / İSTATİSTİK
    ----------------------------------------------------------
  */

  const [
    showInviteMember,
    setShowInviteMember,
  ] = useState(false);

  const [
    inviteEmail,
    setInviteEmail,
  ] = useState("");

  const [
    inviteRole,
    setInviteRole,
  ] = useState("DEVELOPER");

  const [
    showStatistics,
    setShowStatistics,
  ] = useState(false);

  /*
    ----------------------------------------------------------
    MESAJLAŞMA
    ----------------------------------------------------------
  */

  const [
    messageUsers,
    setMessageUsers,
  ] = useState([]);

  const [
    selectedChatUser,
    setSelectedChatUser,
  ] = useState(null);

  const [
    chatMessages,
    setChatMessages,
  ] = useState([]);

  const [
    newMessage,
    setNewMessage,
  ] = useState("");

  const [
    chatLoading,
    setChatLoading,
  ] = useState(false);

  const [messageSearchText, setMessageSearchText] = useState("");

  const chatScrollRef =
    useRef(null);

  /*
    ----------------------------------------------------------
    PROFİL
    ----------------------------------------------------------
  */

  const [
    showProfile,
    setShowProfile,
  ] = useState(false);

  const [
    showEditProfile,
    setShowEditProfile,
  ] = useState(false);

  const [
    profileName,
    setProfileName,
  ] = useState("");

  const [
    currentPassword,
    setCurrentPassword,
  ] = useState("");

  const [
    newPassword,
    setNewPassword,
  ] = useState("");

  /*
    ----------------------------------------------------------
    EKRAN ÖLÇÜSÜ
    ----------------------------------------------------------
  */

  const screenWidth =
    Dimensions.get("window").width;

  const columnWidth = Math.min(
    Math.max(
      screenWidth - 38,
      300
    ),
    390
  );

  /*
    ----------------------------------------------------------
    AKTİF PANO
    ----------------------------------------------------------
  */

  const activeProject =
    useMemo(
      () =>
        projects.find(
          (project) =>
            project.id ===
            activeProjectId
        ) || null,
      [
        projects,
        activeProjectId,
      ]
    );

  const isManager =
    activeProject?.currentUserRole ===
    "MANAGER";

  /*
    ----------------------------------------------------------
    BAŞLANGIÇ
    ----------------------------------------------------------
  */

  useEffect(() => {
    restoreSession();
  }, []);

  useEffect(() => {
    if (token) {
      fetchProjects();
    }
  }, [token]);

  useEffect(() => {
    if (
      token &&
      activeProjectId
    ) {
      loadActiveBoard(
        activeProjectId
      );
    }
  }, [
    token,
    activeProjectId,
  ]);

  useEffect(() => {
    if (
      token &&
      currentScreen ===
        "messages"
    ) {
      fetchMessageUsers();
    }
  }, [
    token,
    currentScreen,
  ]);

  /*
    ----------------------------------------------------------
    TEMA SAKLAMA
    ----------------------------------------------------------
  */

  useEffect(() => {
    AsyncStorage.setItem(
      "panovio_theme",
      isDark
        ? "dark"
        : "light"
    ).catch(() => {});
  }, [isDark]);

  /*
    ----------------------------------------------------------
    OTURUM
    ----------------------------------------------------------
  */

  const restoreSession =
    async () => {
      try {
        const [
          savedToken,
          savedUser,
          savedTheme,
        ] = await Promise.all([
          AsyncStorage.getItem(
            "panovio_token"
          ),
          AsyncStorage.getItem(
            "panovio_user"
          ),
          AsyncStorage.getItem(
            "panovio_theme"
          ),
        ]);

        if (
          savedTheme === "light"
        ) {
          setIsDark(false);
        }

        if (
          savedTheme === "dark"
        ) {
          setIsDark(true);
        }

        if (
          savedToken &&
          savedUser
        ) {
          setToken(savedToken);

          setUser(
            JSON.parse(
              savedUser
            )
          );
        }
      } catch (error) {
        console.log(
          "Oturum geri yüklenemedi:",
          error
        );
      } finally {
        setAppLoading(false);
      }
    };

  const saveSession =
    async (data) => {
      await Promise.all([
        AsyncStorage.setItem(
          "panovio_token",
          data.token
        ),

        AsyncStorage.setItem(
          "panovio_user",
          JSON.stringify(
            data.user
          )
        ),
      ]);

      setToken(data.token);
      setUser(data.user);
    };

  /*
    JSON istekleri için standart header.
  */

  const getAuthHeaders =
    () => ({
      "Content-Type":
        "application/json",

      Authorization:
        `Bearer ${token}`,
    });

  /*
    Dosya yüklemede Content-Type elle yazılmayacak.
    FormData boundary değerini React Native oluşturacak.
  */

  const getFileAuthHeaders =
    () => ({
      Authorization:
        `Bearer ${token}`,
    });

  /*
    ----------------------------------------------------------
    AUTH FORM TEMİZLE
    ----------------------------------------------------------
  */

  const clearAuthForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setAuthMessage("");
  };

  const changeAuthMode = (
    loginMode
  ) => {
    setIsLoginMode(loginMode);
    clearAuthForm();
  };

  /*
    ----------------------------------------------------------
    GİRİŞ
    ----------------------------------------------------------
  */

  const handleLogin =
    async () => {
      if (
        !email.trim() ||
        !password
      ) {
        setAuthMessage(
          "Lütfen e-posta ve şifreni gir."
        );

        return;
      }

      try {
        setLoading(true);
        setAuthMessage("");

        const response =
          await fetch(
            `${API_URL}/auth/login`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                email:
                  email
                    .trim()
                    .toLowerCase(),

                password,
              }),
            }
          );

        const data =
          await response
            .json()
            .catch(
              () => ({})
            );

        if (!response.ok) {
          setAuthMessage(
            data.error ||
              "Giriş yapılamadı."
          );

          return;
        }

        await saveSession(data);

        clearAuthForm();
      } catch (error) {
        console.log(
          "Giriş hatası:",
          error
        );

        setAuthMessage(
          "Sunucuya bağlanılamadı."
        );
      } finally {
        setLoading(false);
      }
    };

  const handleDemoLogin = async (roleType) => {
    try {
      setLoading(true);
      setAuthMessage("");
      const response = await fetch(`${API_URL}/auth/demo-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleType }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setAuthMessage(data.error || "Demo giriş yapılamadı.");
        return;
      }
      await saveSession(data);
      clearAuthForm();
    } catch (error) {
      setAuthMessage("Sunucuya bağlanılamadı.");
    } finally {
      setLoading(false);
    }
  };

  const resetForgotFlow = () => {
    setForgotStep(1);
    setForgotEmail(email.trim());
    setForgotCode("");
    setForgotNewPassword("");
    setForgotConfirmPassword("");
    setForgotMessage("");
  };

  const requestResetCode = async () => {
    if (!forgotEmail.trim()) return setForgotMessage("E-posta adresini gir.");
    try {
      setForgotLoading(true); setForgotMessage("");
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim().toLowerCase() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) return setForgotMessage(data.error || "Kod gönderilemedi.");
      setForgotMessage(data.message || "Doğrulama kodu gönderildi.");
      setForgotStep(2);
    } catch { setForgotMessage("Sunucuya bağlanılamadı."); }
    finally { setForgotLoading(false); }
  };

  const verifyResetCode = async () => {
    if (!/^\d{6}$/.test(forgotCode)) return setForgotMessage("6 haneli doğrulama kodunu gir.");
    try {
      setForgotLoading(true); setForgotMessage("");
      const response = await fetch(`${API_URL}/auth/verify-reset-code`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim().toLowerCase(), code: forgotCode }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) return setForgotMessage(data.error || "Kod doğrulanamadı.");
      setForgotMessage(""); setForgotStep(3);
    } catch { setForgotMessage("Sunucuya bağlanılamadı."); }
    finally { setForgotLoading(false); }
  };

  const resetPassword = async () => {
    if (forgotNewPassword.length < 8) return setForgotMessage("Yeni şifre en az 8 karakter olmalıdır.");
    if (forgotNewPassword !== forgotConfirmPassword) return setForgotMessage("Yeni şifreler eşleşmiyor.");
    try {
      setForgotLoading(true); setForgotMessage("");
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim().toLowerCase(), code: forgotCode, newPassword: forgotNewPassword }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) return setForgotMessage(data.error || "Şifre güncellenemedi.");
      setForgotMessage(data.message || "Şifren başarıyla güncellendi.");
      setForgotStep(4);
    } catch { setForgotMessage("Sunucuya bağlanılamadı."); }
    finally { setForgotLoading(false); }
  };

  /*
    ----------------------------------------------------------
    KAYIT
    ----------------------------------------------------------
  */

  const handleRegister =
    async () => {
      if (
        !name.trim() ||
        !email.trim() ||
        !password
      ) {
        setAuthMessage(
          "Lütfen tüm alanları doldur."
        );

        return;
      }

      if (
        password.length < 8
      ) {
        setAuthMessage(
          "Şifre en az 8 karakter olmalıdır."
        );

        return;
      }

      if (
        password !==
        confirmPassword
      ) {
        setAuthMessage(
          "Şifreler birbiriyle eşleşmiyor."
        );

        return;
      }

      try {
        setLoading(true);
        setAuthMessage("");

        const response =
          await fetch(
            `${API_URL}/auth/register`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                name:
                  name.trim(),

                email:
                  email
                    .trim()
                    .toLowerCase(),

                password,
              }),
            }
          );

        const data =
          await response
            .json()
            .catch(
              () => ({})
            );

        if (!response.ok) {
          setAuthMessage(
            data.error ||
              "Kayıt oluşturulamadı."
          );

          return;
        }

        await saveSession(data);

        clearAuthForm();
      } catch (error) {
        console.log(
          "Kayıt hatası:",
          error
        );

        setAuthMessage(
          "Sunucuya bağlanılamadı."
        );
      } finally {
        setLoading(false);
      }
    };

  const handleAuth = () => {
    if (isLoginMode) {
      handleLogin();
    } else {
      handleRegister();
    }
  };

  /*
    ----------------------------------------------------------
    ÇIKIŞ
    ----------------------------------------------------------
  */

  const handleLogout =
    async () => {
      await Promise.all([
        AsyncStorage.removeItem(
          "panovio_token"
        ),

        AsyncStorage.removeItem(
          "panovio_user"
        ),
      ]);

      setToken("");
      setUser(null);

      setProjects([]);
      setColumns([]);
      setTasks([]);
      setMembers([]);

      setActiveProjectId(
        null
      );

      setCurrentScreen(
        "boards"
      );

      setSelectedTask(null);
      setSelectedChatUser(
        null
      );

      setChatMessages([]);
      setMessageUsers([]);

      clearAuthForm();
    };
      /*
    ============================================================
    ORTAK API YARDIMCISI
    ============================================================
  */

  const apiRequest = async (
    path,
    options = {}
  ) => {
    const response = await fetch(
      `${API_URL}${path}`,
      {
        ...options,

        headers: {
          ...getAuthHeaders(),
          ...(options.headers || {}),
        },
      }
    );

    const data = await response
      .json()
      .catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.error ||
          "İşlem gerçekleştirilemedi."
      );
    }

    return data;
  };

  /*
    ============================================================
    PANOLARI GETİR
    ============================================================
  */

  const fetchProjects =
    async () => {
      try {
        const data =
          await apiRequest(
            "/projects"
          );

        const list =
          Array.isArray(data)
            ? data
            : [];

        setProjects(list);

        /*
          Daha önce seçilmiş pano hâlâ varsa
          aynı panoda kalıyoruz.

          Yoksa ilk panoyu açıyoruz.
        */

        setActiveProjectId(
          (currentId) => {
            const stillExists =
              list.some(
                (project) =>
                  project.id ===
                  currentId
              );

            if (stillExists) {
              return currentId;
            }

            return (
              list[0]?.id ||
              null
            );
          }
        );
      } catch (error) {
        console.log(
          "Panolar getirilemedi:",
          error
        );

        Alert.alert(
          "Panolar",
          error.message
        );
      }
    };

  /*
    ============================================================
    AKTİF PANOYU YÜKLE
    ============================================================
  */

  const loadActiveBoard =
    async (projectId) => {
      if (!projectId) {
        return;
      }

      try {
        setLoading(true);

        await Promise.all([
          fetchColumns(
            projectId
          ),

          fetchTasks(
            projectId
          ),

          fetchProjectMembers(
            projectId
          ),
        ]);
      } catch (error) {
        console.log(
          "Pano yüklenemedi:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

  /*
    ============================================================
    SÜTUNLARI GETİR
    ============================================================
  */

  const fetchColumns =
    async (projectId) => {
      try {
        const data =
          await apiRequest(
            `/projects/${projectId}/columns`
          );

        const list =
          Array.isArray(data)
            ? data
            : [];

        const sorted = [
          ...list,
        ].sort(
          (a, b) =>
            (a.order || 0) -
            (b.order || 0)
        );

        setColumns(sorted);
      } catch (error) {
        console.log(
          "Listeler getirilemedi:",
          error
        );

        setColumns([]);

        throw error;
      }
    };

  /*
    ============================================================
    GÖREVLERİ GETİR
    ============================================================
  */

  const fetchTasks =
    async (projectId) => {
      try {
        const data =
          await apiRequest(
            `/tasks?projectId=${projectId}`
          );

        setTasks(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (error) {
        console.log(
          "Görevler getirilemedi:",
          error
        );

        setTasks([]);

        throw error;
      }
    };

  /*
    ============================================================
    PANO ÜYELERİNİ GETİR
    ============================================================
  */

  const fetchProjectMembers =
    async (projectId) => {
      try {
        const data =
          await apiRequest(
            `/projects/${projectId}/members`
          );

        setMembers(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (error) {
        console.log(
          "Üyeler getirilemedi:",
          error
        );

        setMembers([]);
      }
    };

  /*
    ============================================================
    YENİLE
    ============================================================
  */

  const handleRefresh =
    async () => {
      if (!activeProjectId) {
        return;
      }

      try {
        setRefreshing(true);

        await Promise.all([
          fetchProjects(),

          fetchColumns(
            activeProjectId
          ),

          fetchTasks(
            activeProjectId
          ),

          fetchProjectMembers(
            activeProjectId
          ),
        ]);
      } finally {
        setRefreshing(false);
      }
    };

  /*
    ============================================================
    PANO OLUŞTUR
    ============================================================
  */

  const handleCreateProject =
    async () => {
      if (
        !projectTitle.trim()
      ) {
        Alert.alert(
          "Pano adı",
          "Lütfen pano adını yaz."
        );

        return;
      }

      try {
        setLoading(true);

        const created =
          await apiRequest(
            "/projects",
            {
              method: "POST",

              body:
                JSON.stringify({
                  title:
                    projectTitle.trim(),

                  background:
                    projectColor,
                }),
            }
          );

        setShowCreateProject(
          false
        );

        setProjectTitle("");

        setProjectColor(
          BOARD_COLORS[1]
            .value
        );

        if (created?.id) {
          for (const title of ["Yapılacaklar", "Devam Edenler", "Tamamlandı"]) {
            await apiRequest(`/projects/${created.id}/columns`, {
              method: "POST",
              body: JSON.stringify({ title, color: projectColor }),
            });
          }
        }

        await fetchProjects();

        if (created?.id) {
          setActiveProjectId(created.id);
          await loadActiveBoard(created.id);
        }
      } catch (error) {
        Alert.alert(
          "Pano oluşturulamadı",
          error.message
        );
      } finally {
        setLoading(false);
      }
    };

  /*
    ============================================================
    PANO DÜZENLEME MODALINI AÇ
    ============================================================
  */

  const openEditBoard =
    () => {
      if (!activeProject) {
        return;
      }

      setEditBoardTitle(
        activeProject.title ||
          ""
      );

      /*
        Eski web panolarında background CSS gradient
        olabilir.

        Mobil renk seçicide geçerli HEX değilse
        varsayılan Panovio mavisini seçiyoruz.
      */

      const currentBackground =
        String(
          activeProject.background ||
            ""
        );

      const isHex =
        /^#[0-9A-Fa-f]{6}$/.test(
          currentBackground
        );

      setEditBoardColor(
        isHex
          ? currentBackground
          : BOARD_COLORS[1]
              .value
      );

      setShowBoardMenu(false);

      setShowEditBoard(true);
    };

  /*
    ============================================================
    PANO GÜNCELLE
    ============================================================
  */

  const handleUpdateBoard =
    async () => {
      if (!activeProjectId) {
        return;
      }

      if (
        !editBoardTitle.trim()
      ) {
        Alert.alert(
          "Pano adı",
          "Pano adı boş bırakılamaz."
        );

        return;
      }

      try {
        setLoading(true);

        await apiRequest(
          `/projects/${activeProjectId}`,
          {
            method: "PUT",

            body:
              JSON.stringify({
                title:
                  editBoardTitle.trim(),

                background:
                  editBoardColor,
              }),
          }
        );

        setShowEditBoard(
          false
        );

        await fetchProjects();
      } catch (error) {
        Alert.alert(
          "Pano güncellenemedi",
          error.message
        );
      } finally {
        setLoading(false);
      }
    };

  /*
    ============================================================
    PANO SİL
    ============================================================
  */

  const handleDeleteBoard =
    () => {
      if (!activeProjectId) {
        return;
      }

      Alert.alert(
        "Panoyu sil",
        `"${activeProject?.title || "Bu pano"}" kalıcı olarak silinsin mi? Panodaki görevler ve listeler de silinir.`,
        [
          {
            text: "Vazgeç",
            style: "cancel",
          },

          {
            text: "Panoyu Sil",
            style:
              "destructive",

            onPress:
              async () => {
                try {
                  setLoading(
                    true
                  );

                  await apiRequest(
                    `/projects/${activeProjectId}`,
                    {
                      method:
                        "DELETE",
                    }
                  );

                  setShowBoardMenu(
                    false
                  );

                  setColumns([]);
                  setTasks([]);
                  setMembers([]);

                  setActiveProjectId(
                    null
                  );

                  await fetchProjects();
                } catch (
                  error
                ) {
                  Alert.alert(
                    "Pano silinemedi",
                    error.message
                  );
                } finally {
                  setLoading(
                    false
                  );
                }
              },
          },
        ]
      );
    };

  /*
    ============================================================
    SÜTUN OLUŞTURMA MODALINI AÇ
    ============================================================
  */

  const openCreateColumn =
    () => {
      if (!isManager) {
        Alert.alert(
          "Yetki gerekli",
          "Yeni liste oluşturmak için pano yöneticisi olmalısın."
        );

        return;
      }

      setColumnTitle("");

      setShowCreateColumn(
        true
      );
    };

  /*
    ============================================================
    YENİ SÜTUN / LİSTE
    ============================================================
  */

  const handleCreateColumn =
    async () => {
      if (!activeProjectId) {
        return;
      }

      if (
        !columnTitle.trim()
      ) {
        Alert.alert(
          "Liste adı",
          "Lütfen liste adını yaz."
        );

        return;
      }

      try {
        setLoading(true);

        await apiRequest(
          `/projects/${activeProjectId}/columns`,
          {
            method: "POST",

            body:
              JSON.stringify({
                title:
                  columnTitle.trim(),

                color:
                  theme.primary,
              }),
          }
        );

        setColumnTitle("");

        setShowCreateColumn(
          false
        );

        await fetchColumns(
          activeProjectId
        );
      } catch (error) {
        Alert.alert(
          "Liste oluşturulamadı",
          error.message
        );
      } finally {
        setLoading(false);
      }
    };

  /*
    ============================================================
    SÜTUN MENÜSÜ

    Sağ üstteki gereksiz + işaretini kaldırıyoruz.

    Burada sadece üç nokta olacak:
      • Liste adını düzenle
      • Listeyi sil
    ============================================================
  */

  const openColumnMenu =
    (column) => {
      if (!isManager) {
        return;
      }

      setSelectedColumn(
        column
      );

      setEditColumnTitle(
        column.title || ""
      );

      setShowColumnMenu(
        true
      );
    };

  /*
    ============================================================
    SÜTUN ADINI DÜZENLE
    ============================================================
  */

  const handleRenameColumn =
    async () => {
      if (
        !selectedColumn?.id
      ) {
        return;
      }

      if (
        !editColumnTitle.trim()
      ) {
        Alert.alert(
          "Liste adı",
          "Liste adı boş bırakılamaz."
        );

        return;
      }

      try {
        setLoading(true);

        await apiRequest(
          `/columns/${selectedColumn.id}`,
          {
            method: "PUT",

            body:
              JSON.stringify({
                title:
                  editColumnTitle.trim(),
              }),
          }
        );

        setShowColumnMenu(
          false
        );

        setSelectedColumn(
          null
        );

        await fetchColumns(
          activeProjectId
        );
      } catch (error) {
        Alert.alert(
          "Liste güncellenemedi",
          error.message
        );
      } finally {
        setLoading(false);
      }
    };

  /*
    ============================================================
    SÜTUN SİL
    ============================================================
  */

  const handleDeleteColumn =
    () => {
      if (
        !selectedColumn?.id
      ) {
        return;
      }

      Alert.alert(
        "Listeyi sil",
        `"${selectedColumn.title}" listesi silinsin mi?`,
        [
          {
            text: "Vazgeç",
            style: "cancel",
          },

          {
            text: "Listeyi Sil",
            style:
              "destructive",

            onPress:
              async () => {
                try {
                  setLoading(
                    true
                  );

                  await apiRequest(
                    `/columns/${selectedColumn.id}`,
                    {
                      method:
                        "DELETE",
                    }
                  );

                  setShowColumnMenu(
                    false
                  );

                  setSelectedColumn(
                    null
                  );

                  await Promise.all([
                    fetchColumns(
                      activeProjectId
                    ),

                    fetchTasks(
                      activeProjectId
                    ),
                  ]);
                } catch (
                  error
                ) {
                  Alert.alert(
                    "Liste silinemedi",
                    error.message
                  );
                } finally {
                  setLoading(
                    false
                  );
                }
              },
          },
        ]
      );
    };

  /*
    ============================================================
    ÜYE DAVET ET
    ============================================================
  */

  const openInviteMember =
    () => {
      if (!isManager) {
        Alert.alert(
          "Yetki gerekli",
          "Üye davet etme işlemini yalnızca pano yöneticisi yapabilir."
        );

        return;
      }

      setInviteEmail("");

      setInviteRole(
        "DEVELOPER"
      );

      setShowBoardMenu(
        false
      );

      setShowInviteMember(
        true
      );
    };

  const handleInviteMember =
    async () => {
      if (!activeProjectId) {
        return;
      }

      if (
        !inviteEmail.trim()
      ) {
        Alert.alert(
          "E-posta",
          "Davet edeceğin kullanıcının e-posta adresini yaz."
        );

        return;
      }

      try {
        setLoading(true);

        await apiRequest(
          `/projects/${activeProjectId}/members`,
          {
            method: "POST",

            body:
              JSON.stringify({
                email:
                  inviteEmail
                    .trim()
                    .toLowerCase(),

                role:
                  inviteRole,
              }),
          }
        );

        setShowInviteMember(
          false
        );

        setInviteEmail("");

        await Promise.all([
          fetchProjectMembers(
            activeProjectId
          ),

          fetchProjects(),
        ]);

        Alert.alert(
          "Başarılı",
          "Kullanıcı panoya eklendi."
        );
      } catch (error) {
        Alert.alert(
          "Üye eklenemedi",
          error.message
        );
      } finally {
        setLoading(false);
      }
    };

  /*
    ============================================================
    YENİ GÖREV MODALINI AÇ
    ============================================================
  */

  const openCreateTask =
    (columnId = null) => {
      if (!activeProjectId) {
        return;
      }

      setTaskTitle("");

      /*
        Web sürümündeki yeni görev tasarımına yaklaşmak için
        açıklama alanını görev oluşturma ekranında ana alan
        olarak göstermeyeceğiz.

        Bunun yerine:
          • dosya
          • başlangıç tarihi
          • bitiş tarihi
          • öncelik
          • liste
          • sorumlu
        öne çıkacak.

        Description backend uyumluluğu için state'te kalıyor.
      */

      setTaskDescription("");

      setTaskPriority(
        "medium"
      );

      setTaskStartDate("");
      setTaskDueDate("");

      setTaskAssignedToId(
        ""
      );

      setPendingAttachments(
        []
      );

      const firstColumnId =
        columnId ||
        columns[0]?.id ||
        "";

      setTaskColumnId(
        String(
          firstColumnId
        )
      );

      setShowBoardMenu(
        false
      );

      setShowCreateTask(
        true
      );
    };

  /*
    ============================================================
    GÖREV OLUŞTUR
    ============================================================
  */

  const handleCreateTask =
    async () => {
      if (
        !taskTitle.trim()
      ) {
        Alert.alert(
          "Görev başlığı",
          "Görev başlığı boş bırakılamaz."
        );

        return;
      }

      if (!taskColumnId) {
        Alert.alert(
          "Liste seç",
          "Görevin ekleneceği listeyi seç."
        );

        return;
      }

      let startDate = null;
      let dueDate = null;

      if (
        taskStartDate.trim()
      ) {
        startDate =
          normalizeDateInput(
            taskStartDate
          );

        if (!startDate) {
          Alert.alert(
            "Başlangıç tarihi",
            "Tarihi 18.09.2026 veya 2026-09-18 şeklinde yaz."
          );

          return;
        }
      }

      if (
        taskDueDate.trim()
      ) {
        dueDate =
          normalizeDateInput(
            taskDueDate
          );

        if (!dueDate) {
          Alert.alert(
            "Bitiş tarihi",
            "Tarihi 18.09.2026 veya 2026-09-18 şeklinde yaz."
          );

          return;
        }
      }

      if (
        startDate &&
        dueDate &&
        new Date(dueDate) <
          new Date(startDate)
      ) {
        Alert.alert(
          "Tarih kontrolü",
          "Bitiş tarihi başlangıç tarihinden önce olamaz."
        );

        return;
      }

      try {
        setLoading(true);

        const created =
          await apiRequest(
            "/tasks",
            {
              method: "POST",

              body:
                JSON.stringify({
                  title:
                    taskTitle.trim(),

                  description:
                    taskDescription.trim() ||
                    null,

                  priority:
                    taskPriority,

                  projectId:
                    activeProjectId,

                  columnId:
                    Number(
                      taskColumnId
                    ),

                  assignedToId:
                    taskAssignedToId
                      ? Number(
                          taskAssignedToId
                        )
                      : null,

                  startDate,

                  dueDate,

                  status:
                    "todo",
                }),
            }
          );

        /*
          Dosya seçilmişse görev oluşturulduktan sonra
          dosyaları bu görevin ID'sine yükleyeceğiz.

          uploadPendingAttachments fonksiyonu sonraki
          parçada geliyor.
        */

        if (
          created?.id &&
          pendingAttachments.length >
            0
        ) {
          await uploadPendingAttachments(
            created.id
          );
        }

        setShowCreateTask(
          false
        );

        setPendingAttachments(
          []
        );

        await fetchTasks(
          activeProjectId
        );
      } catch (error) {
        Alert.alert(
          "Görev oluşturulamadı",
          error.message
        );
      } finally {
        setLoading(false);
      }
    };

  /*
    ============================================================
    GÖREV DETAYINI AÇ
    ============================================================
  */

  const openTaskDetails =
    (task) => {
      setSelectedTask(
        task
      );

      setChecklistText("");
      setLabelText("");
      setCommentText("");
    };

  /*
    ============================================================
    GÖREV DÜZENLEME
    ============================================================
  */

  const openEditTask =
    () => {
      if (!selectedTask) {
        return;
      }

      setTaskTitle(
        selectedTask.title ||
          ""
      );

      setTaskDescription(
        selectedTask.description ||
          ""
      );

      setTaskPriority(
        normalizePriority(
          selectedTask.priority
        )
      );

      setTaskColumnId(
        String(
          selectedTask.columnId ||
            columns[0]?.id ||
            ""
        )
      );

      setTaskAssignedToId(
        selectedTask.assignedToId
          ? String(
              selectedTask.assignedToId
            )
          : selectedTask.assignedTo
                ?.id
            ? String(
                selectedTask
                  .assignedTo.id
              )
            : ""
      );

      setTaskStartDate(
        selectedTask.startDate
          ? String(
              selectedTask.startDate
            ).slice(0, 10)
          : ""
      );

      setTaskDueDate(
        selectedTask.dueDate
          ? String(
              selectedTask.dueDate
            ).slice(0, 10)
          : ""
      );

      setShowEditTask(
        true
      );
    };

  const handleUpdateTask =
    async () => {
      if (!selectedTask?.id) {
        return;
      }

      if (
        !taskTitle.trim()
      ) {
        Alert.alert(
          "Görev başlığı",
          "Görev başlığı boş bırakılamaz."
        );

        return;
      }

      const startDate =
        taskStartDate.trim()
          ? normalizeDateInput(
              taskStartDate
            )
          : null;

      const dueDate =
        taskDueDate.trim()
          ? normalizeDateInput(
              taskDueDate
            )
          : null;

      if (
        taskStartDate.trim() &&
        !startDate
      ) {
        Alert.alert(
          "Başlangıç tarihi",
          "Geçerli bir tarih gir."
        );

        return;
      }

      if (
        taskDueDate.trim() &&
        !dueDate
      ) {
        Alert.alert(
          "Bitiş tarihi",
          "Geçerli bir tarih gir."
        );

        return;
      }

      if (
        startDate &&
        dueDate &&
        new Date(dueDate) <
          new Date(startDate)
      ) {
        Alert.alert(
          "Tarih kontrolü",
          "Bitiş tarihi başlangıç tarihinden önce olamaz."
        );

        return;
      }

      try {
        setLoading(true);

        const updated =
          await apiRequest(
            `/tasks/${selectedTask.id}`,
            {
              method: "PUT",

              body:
                JSON.stringify({
                  title:
                    taskTitle.trim(),

                  description:
                    taskDescription.trim() ||
                    null,

                  priority:
                    taskPriority,

                  startDate,
                  dueDate,

                  columnId:
                    Number(
                      taskColumnId
                    ),

                  assignedToId:
                    taskAssignedToId
                      ? Number(
                          taskAssignedToId
                        )
                      : null,
                }),
            }
          );

        setSelectedTask(
          updated
        );

        setShowEditTask(
          false
        );

        await fetchTasks(
          activeProjectId
        );
      } catch (error) {
        Alert.alert(
          "Görev güncellenemedi",
          error.message
        );
      } finally {
        setLoading(false);
      }
    };

  /*
    ============================================================
    GÖREVİ ÖNCEKİ / SONRAKİ LİSTEYE TAŞI
    ============================================================
  */

  const moveTaskToColumn = async (task, targetColumn) => {
    if (!task?.id || !targetColumn?.id) return;

    if (Number(task.columnId) === Number(targetColumn.id)) {
      return;
    }

    try {
      setLoading(true);

      const updated = await apiRequest(`/tasks/${task.id}`, {
        method: "PUT",
        body: JSON.stringify({
          columnId: targetColumn.id,
          columnName: targetColumn.title,
        }),
      });

      setSelectedTask((current) =>
        current?.id === task.id ? { ...current, ...updated } : current
      );

      await fetchTasks(activeProjectId);
    } catch (error) {
      Alert.alert("Görev taşınamadı", error.message);
    } finally {
      setLoading(false);
    }
  };

  /*
    ============================================================
    GÖREV SİL
    ============================================================
  */

  const handleDeleteTask =
    (task = selectedTask) => {
      if (!task?.id) {
        return;
      }

      Alert.alert(
        "Görevi sil",
        `"${task.title}" görevi silinsin mi?`,
        [
          {
            text: "Vazgeç",
            style: "cancel",
          },

          {
            text: "Görevi Sil",
            style:
              "destructive",

            onPress:
              async () => {
                try {
                  setLoading(
                    true
                  );

                  await apiRequest(
                    `/tasks/${task.id}`,
                    {
                      method:
                        "DELETE",
                    }
                  );

                  setSelectedTask(
                    null
                  );

                  await fetchTasks(
                    activeProjectId
                  );
                } catch (
                  error
                ) {
                  Alert.alert(
                    "Görev silinemedi",
                    error.message
                  );
                } finally {
                  setLoading(
                    false
                  );
                }
              },
          },
        ]
      );
    };

  /*
    ============================================================
    FİLTRELER
    ============================================================
  */

  const clearFilters =
    () => {
      setPriorityFilter(
        "all"
      );

      setDateFilter("all");

      setOnlyMine(false);

      setSearchText("");
    };

  const filteredTasks =
    useMemo(() => {
      let result = [
        ...tasks,
      ];

      /*
        ARAMA
      */

      const search =
        searchText
          .trim()
          .toLocaleLowerCase(
            "tr-TR"
          );

      if (search) {
        result =
          result.filter(
            (task) => {
              const title =
                String(
                  task.title ||
                    ""
                ).toLocaleLowerCase(
                  "tr-TR"
                );

              const description =
                String(
                  task.description ||
                    ""
                ).toLocaleLowerCase(
                  "tr-TR"
                );

              const assignee =
                String(
                  task.assignedTo
                    ?.name || ""
                ).toLocaleLowerCase(
                  "tr-TR"
                );

              return (
                title.includes(
                  search
                ) ||
                description.includes(
                  search
                ) ||
                assignee.includes(
                  search
                )
              );
            }
          );
      }

      /*
        BANA AİT
      */

      if (
        onlyMine &&
        user?.id
      ) {
        result =
          result.filter(
            (task) =>
              Number(
                task.assignedToId ||
                  task.assignedTo
                    ?.id
              ) ===
              Number(user.id)
          );
      }

      /*
        ÖNCELİK
      */

      if (
        priorityFilter !==
        "all"
      ) {
        result =
          result.filter(
            (task) =>
              normalizePriority(
                task.priority
              ) ===
              priorityFilter
          );
      }

      /*
        TARİH

        Web sürümüne yaklaşmak için:
          • Bugün
          • Bu hafta
          • Geciken
          • Tarihsiz
      */

      if (
        dateFilter ===
        "today"
      ) {
        result =
          result.filter(
            (task) =>
              isToday(
                task.dueDate
              )
          );
      }

      if (
        dateFilter ===
        "week"
      ) {
        result =
          result.filter(
            (task) =>
              isThisWeek(
                task.dueDate
              )
          );
      }

      if (
        dateFilter ===
        "overdue"
      ) {
        result =
          result.filter(
            (task) =>
              isOverdue(task)
          );
      }

      if (
        dateFilter ===
        "noDate"
      ) {
        result =
          result.filter(
            (task) =>
              !task.dueDate
          );
      }

      return result;
    }, [
      tasks,
      searchText,
      onlyMine,
      user,
      priorityFilter,
      dateFilter,
    ]);

  /*
    ============================================================
    İSTATİSTİKLER
    ============================================================
  */

  const statistics =
    useMemo(() => {
      const total =
        tasks.length;

      const completedColumnIds =
        new Set(
          columns
            .filter((column) => {
              const name =
                String(
                  column.title ||
                    ""
                ).toLocaleLowerCase(
                  "tr-TR"
                );

              return (
                name.includes(
                  "tamam"
                ) ||
                name.includes(
                  "done"
                )
              );
            })
            .map(
              (column) =>
                column.id
            )
        );

      const completed =
        tasks.filter(
          (task) =>
            completedColumnIds.has(
              task.columnId
            ) ||
            String(
              task.status ||
                ""
            ).toLowerCase() ===
              "done"
        ).length;

      const high =
        tasks.filter(
          (task) =>
            normalizePriority(
              task.priority
            ) === "high"
        ).length;

      const medium =
        tasks.filter(
          (task) =>
            normalizePriority(
              task.priority
            ) === "medium"
        ).length;

      const low =
        tasks.filter(
          (task) =>
            normalizePriority(
              task.priority
            ) === "low"
        ).length;

      const overdue =
        tasks.filter(
          isOverdue
        ).length;

      const mine =
        tasks.filter(
          (task) =>
            Number(
              task.assignedToId ||
                task.assignedTo
                  ?.id
            ) ===
            Number(user?.id)
        ).length;

      const progress =
        total
          ? Math.round(
              (completed /
                total) *
                100
            )
          : 0;

      return {
        total,
        completed,
        high,
        medium,
        low,
        overdue,
        mine,
        progress,
      };
    }, [
      tasks,
      columns,
      user,
    ]);

  /*
    Genel ilerleme yüzdesi.
  */

  const progressPercent =
    statistics.progress;
      /*
    ============================================================
    DOSYA SEÇME / YÜKLEME
    ============================================================

    expo-document-picker paketini uygulama tamamlandıktan
    sonra kuracağız.

    Burada require kullanmamızın nedeni:
    App.js'in geri kalanını tek dosyada tutmak.
  */

  const pickTaskAttachments =
    async () => {
      try {
        const DocumentPicker =
          require("expo-document-picker");

        const result =
          await DocumentPicker.getDocumentAsync({
            type: [
              "application/pdf",
              "application/msword",
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
              "application/vnd.ms-excel",
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              "application/vnd.ms-powerpoint",
              "application/vnd.openxmlformats-officedocument.presentationml.presentation",
              "text/plain",
              "image/png",
              "image/jpeg",
              "image/webp",
            ],

            multiple: true,

            copyToCacheDirectory:
              true,
          });

        if (result.canceled) {
          return;
        }

        const selected =
          result.assets || [];

        if (!selected.length) {
          return;
        }

        /*
          Backend tek istekte en fazla 5 dosya,
          görev başına toplam 10 dosya kabul ediyor.
        */

        const remaining =
          Math.max(
            0,
            5 -
              pendingAttachments.length
          );

        if (remaining === 0) {
          Alert.alert(
            "Dosya sınırı",
            "Tek seferde en fazla 5 dosya seçebilirsin."
          );

          return;
        }

        const accepted =
          selected.slice(
            0,
            remaining
          );

        setPendingAttachments(
          (current) => [
            ...current,
            ...accepted,
          ]
        );

        if (
          selected.length >
          remaining
        ) {
          Alert.alert(
            "Dosya sınırı",
            "Tek seferde en fazla 5 dosya eklenebilir."
          );
        }
      } catch (error) {
        console.log(
          "Dosya seçme hatası:",
          error
        );

        Alert.alert(
          "Dosya seçilemedi",
          "Dosya seçici açılamadı."
        );
      }
    };

  const removePendingAttachment =
    (index) => {
      setPendingAttachments(
        (current) =>
          current.filter(
            (_, itemIndex) =>
              itemIndex !== index
          )
      );
    };

  /*
    Yeni görev oluşturulduktan sonra seçilen
    dosyaları backend'e yüklüyoruz.
  */

  const uploadPendingAttachments =
    async (taskId) => {
      if (
        !taskId ||
        !pendingAttachments.length
      ) {
        return;
      }

      const formData =
        new FormData();

      for (
        let index = 0;
        index < pendingAttachments.length;
        index += 1
      ) {
        const file =
          pendingAttachments[index];

        const fileResponse =
          await fetch(file.uri);

        const fileBlob =
          await fileResponse.blob();

        formData.append(
          "files",
          fileBlob,
          file.name ||
            `panovio-dosya-${index + 1}`
        );
      }

      const response =
        await fetch(
          `${API_URL}/tasks/${taskId}/attachments`,
          {
            method: "POST",

            headers:
              getFileAuthHeaders(),

            body: formData,
          }
        );

      const data =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Dosyalar yüklenemedi."
        );
      }

      return data;
    };

  /*
    ============================================================
    MEVCUT GÖREVE DOSYA EKLE
    ============================================================
  */

  const addAttachmentsToExistingTask =
    async () => {
      if (!selectedTask?.id) {
        return;
      }

      try {
        const DocumentPicker =
          require("expo-document-picker");

        const result =
          await DocumentPicker.getDocumentAsync({
            type: [
              "application/pdf",
              "application/msword",
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
              "application/vnd.ms-excel",
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              "application/vnd.ms-powerpoint",
              "application/vnd.openxmlformats-officedocument.presentationml.presentation",
              "text/plain",
              "image/png",
              "image/jpeg",
              "image/webp",
            ],

            multiple: true,

            copyToCacheDirectory:
              true,
          });

        if (result.canceled) {
          return;
        }

        const files =
          (result.assets || [])
            .slice(0, 5);

        if (!files.length) {
          return;
        }

        setLoading(true);

        const formData =
          new FormData();

        for (
          let index = 0;
          index < files.length;
          index += 1
        ) {
          const file =
            files[index];

          const fileResponse =
            await fetch(file.uri);

          const fileBlob =
            await fileResponse.blob();

          formData.append(
            "files",
            fileBlob,
            file.name ||
              `panovio-dosya-${index + 1}`
          );
        }

        const response =
          await fetch(
            `${API_URL}/tasks/${selectedTask.id}/attachments`,
            {
              method: "POST",

              headers:
                getFileAuthHeaders(),

              body: formData,
            }
          );

        const data =
          await response
            .json()
            .catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Dosya yüklenemedi."
          );
        }

        await refreshSelectedTask(
          selectedTask.id
        );

        await fetchTasks(
          activeProjectId
        );
      } catch (error) {
        console.log(
          "Dosya yükleme:",
          error
        );

        Alert.alert(
          "Dosya yüklenemedi",
          error.message
        );
      } finally {
        setLoading(false);
      }
    };

  /*
    ============================================================
    DOSYA SİL
    ============================================================
  */

  const handleDeleteAttachment =
    (attachment) => {
      if (!attachment?.id) {
        return;
      }

      Alert.alert(
        "Dosyayı sil",
        `"${attachment.originalName || "Dosya"}" görevden kaldırılsın mı?`,
        [
          {
            text: "Vazgeç",
            style: "cancel",
          },

          {
            text: "Sil",
            style:
              "destructive",

            onPress:
              async () => {
                try {
                  setLoading(
                    true
                  );

                  await apiRequest(
                    `/attachments/${attachment.id}`,
                    {
                      method:
                        "DELETE",
                    }
                  );

                  await refreshSelectedTask(
                    selectedTask.id
                  );

                  await fetchTasks(
                    activeProjectId
                  );
                } catch (
                  error
                ) {
                  Alert.alert(
                    "Dosya silinemedi",
                    error.message
                  );
                } finally {
                  setLoading(
                    false
                  );
                }
              },
          },
        ]
      );
    };

  /*
    ============================================================
    GÖREV DETAYINI YENİLE
    ============================================================

    GET /tasks?projectId=... sonucundan güncel görevi
    tekrar buluyoruz. Böylece checklist, etiket, yorum
    ve dosya işlemlerinden sonra modal anında güncelleniyor.
  */

  const refreshSelectedTask =
    async (taskId) => {
      if (
        !activeProjectId ||
        !taskId
      ) {
        return;
      }

      try {
        const data =
          await apiRequest(
            `/tasks?projectId=${activeProjectId}`
          );

        const list =
          Array.isArray(data)
            ? data
            : [];

        setTasks(list);

        const updated =
          list.find(
            (task) =>
              Number(task.id) ===
              Number(taskId)
          );

        if (updated) {
          setSelectedTask(
            updated
          );
        }
      } catch (error) {
        console.log(
          "Görev detayı yenilenemedi:",
          error
        );
      }
    };

  /*
    ============================================================
    CHECKLIST EKLE
    ============================================================
  */

  const handleAddChecklistItem =
    async () => {
      if (!selectedTask?.id) {
        return;
      }

      if (
        !checklistText.trim()
      ) {
        return;
      }

      try {
        setLoading(true);

        await apiRequest(
          `/tasks/${selectedTask.id}/checklist`,
          {
            method: "POST",

            body:
              JSON.stringify({
                title:
                  checklistText.trim(),
              }),
          }
        );

        setChecklistText("");

        await refreshSelectedTask(
          selectedTask.id
        );
      } catch (error) {
        Alert.alert(
          "Checklist",
          error.message
        );
      } finally {
        setLoading(false);
      }
    };

  /*
    ============================================================
    CHECKLIST TAMAMLA / GERİ AÇ
    ============================================================
  */

  const handleToggleChecklist =
    async (item) => {
      if (!item?.id) {
        return;
      }

      try {
        await apiRequest(
          `/checklist/${item.id}`,
          {
            method: "PUT",

            body:
              JSON.stringify({
                isCompleted:
                  !item.isCompleted,
              }),
          }
        );

        await refreshSelectedTask(
          selectedTask.id
        );
      } catch (error) {
        Alert.alert(
          "Checklist",
          error.message
        );
      }
    };

  /*
    ============================================================
    CHECKLIST SİL
    ============================================================
  */

  const handleDeleteChecklist =
    async (item) => {
      if (!item?.id) {
        return;
      }

      try {
        await apiRequest(
          `/checklist/${item.id}`,
          {
            method: "DELETE",
          }
        );

        await refreshSelectedTask(
          selectedTask.id
        );
      } catch (error) {
        Alert.alert(
          "Checklist",
          error.message
        );
      }
    };

  /*
    ============================================================
    ETİKET EKLE
    ============================================================
  */

  const handleAddLabel =
    async () => {
      if (!selectedTask?.id) {
        return;
      }

      if (
        !labelText.trim()
      ) {
        return;
      }

      try {
        setLoading(true);

        await apiRequest(
          `/tasks/${selectedTask.id}/labels`,
          {
            method: "POST",

            body:
              JSON.stringify({
                text:
                  labelText.trim(),

                color:
                  labelColor,
              }),
          }
        );

        setLabelText("");

        await refreshSelectedTask(
          selectedTask.id
        );
      } catch (error) {
        Alert.alert(
          "Etiket",
          error.message
        );
      } finally {
        setLoading(false);
      }
    };

  /*
    ============================================================
    ETİKET SİL
    ============================================================
  */

  const handleDeleteLabel =
    async (label) => {
      if (!label?.id) {
        return;
      }

      try {
        await apiRequest(
          `/labels/${label.id}`,
          {
            method: "DELETE",
          }
        );

        await refreshSelectedTask(
          selectedTask.id
        );
      } catch (error) {
        Alert.alert(
          "Etiket",
          error.message
        );
      }
    };

  /*
    ============================================================
    YORUM EKLE
    ============================================================
  */

  const handleAddComment =
    async () => {
      if (!selectedTask?.id) {
        return;
      }

      if (
        !commentText.trim()
      ) {
        return;
      }

      try {
        setLoading(true);

        await apiRequest(
          `/tasks/${selectedTask.id}/comments`,
          {
            method: "POST",

            body:
              JSON.stringify({
                text:
                  commentText.trim(),
              }),
          }
        );

        setCommentText("");

        await refreshSelectedTask(
          selectedTask.id
        );
      } catch (error) {
        Alert.alert(
          "Yorum",
          error.message
        );
      } finally {
        setLoading(false);
      }
    };

  /*
    ============================================================
    YORUM SİL
    ============================================================
  */

  const handleDeleteComment =
    (comment) => {
      if (!comment?.id) {
        return;
      }

      const canDelete =
        Number(
          comment.userId ||
            comment.user?.id
        ) === Number(user?.id) ||
        isManager;

      if (!canDelete) {
        Alert.alert(
          "Yetki gerekli",
          "Başka bir kullanıcının yorumunu silemezsin."
        );

        return;
      }

      Alert.alert(
        "Yorumu sil",
        "Bu yorum silinsin mi?",
        [
          {
            text: "Vazgeç",
            style: "cancel",
          },

          {
            text: "Sil",
            style:
              "destructive",

            onPress:
              async () => {
                try {
                  await apiRequest(
                    `/comments/${comment.id}`,
                    {
                      method:
                        "DELETE",
                    }
                  );

                  await refreshSelectedTask(
                    selectedTask.id
                  );
                } catch (
                  error
                ) {
                  Alert.alert(
                    "Yorum",
                    error.message
                  );
                }
              },
          },
        ]
      );
    };

  /*
    ============================================================
    ÜYEYİ PANODAN ÇIKAR
    ============================================================
  */

  const handleRemoveMember =
    (member) => {
      if (!isManager) {
        return;
      }

      const memberUser =
        member.user ||
        member;

      if (
        Number(memberUser.id) ===
        Number(user?.id)
      ) {
        Alert.alert(
          "Üye yönetimi",
          "Kendi hesabını bu ekrandan panodan çıkaramazsın."
        );

        return;
      }

      Alert.alert(
        "Üyeyi çıkar",
        `${memberUser.name || memberUser.email} panodan çıkarılsın mı?`,
        [
          {
            text: "Vazgeç",
            style: "cancel",
          },

          {
            text: "Çıkar",
            style:
              "destructive",

            onPress:
              async () => {
                try {
                  setLoading(
                    true
                  );

                  await apiRequest(
                    `/projects/${activeProjectId}/members/${memberUser.id}`,
                    {
                      method:
                        "DELETE",
                    }
                  );

                  await Promise.all([
                    fetchProjectMembers(
                      activeProjectId
                    ),

                    fetchProjects(),
                  ]);
                } catch (
                  error
                ) {
                  Alert.alert(
                    "Üye çıkarılamadı",
                    error.message
                  );
                } finally {
                  setLoading(
                    false
                  );
                }
              },
          },
        ]
      );
    };

  /*
    ============================================================
    MESAJLAŞILABİLECEK KULLANICILARI GETİR
    ============================================================
  */

  const fetchMessageUsers =
    async () => {
      try {
        setChatLoading(true);

        const data =
          await apiRequest(
            "/messages/users"
          );

        let list =
          Array.isArray(data)
            ? data
            : [];

        /*
          Backend zaten kendi hesabımızı döndürmüyor.
          Yine de mobil tarafta ikinci bir güvenlik filtresi
          uyguluyoruz.
        */

        list =
          list.filter(
            (item) =>
              Number(item.id) !==
              Number(user?.id)
          );

        setMessageUsers(
          list
        );

        /*
          Seçili kullanıcı artık listede yoksa sohbeti kapat.
        */

        if (
          selectedChatUser &&
          !list.some(
            (item) =>
              Number(item.id) ===
              Number(
                selectedChatUser.id
              )
          )
        ) {
          setSelectedChatUser(
            null
          );

          setChatMessages([]);
        }
      } catch (error) {
        console.log(
          "Mesaj kullanıcıları:",
          error
        );

        setMessageUsers([]);
      } finally {
        setChatLoading(false);
      }
    };

  /*
    ============================================================
    SOHBETİ AÇ
    ============================================================
  */

  const openChat =
    async (chatUser) => {
      if (!chatUser?.id) {
        return;
      }

      setSelectedChatUser(
        chatUser
      );

      setChatMessages([]);

      setNewMessage("");

      await fetchMessages(
        chatUser.id
      );
    };

  /*
    ============================================================
    MESAJLARI GETİR
    ============================================================
  */

  const fetchMessages =
    async (otherUserId) => {
      if (!otherUserId) {
        return;
      }

      try {
        setChatLoading(true);

        const data =
          await apiRequest(
            `/messages/${otherUserId}`
          );

        setChatMessages(
          Array.isArray(data)
            ? data
            : []
        );

        /*
          Mesajlar çizildikten sonra en alta git.
        */

        setTimeout(() => {
          chatScrollRef.current
            ?.scrollToEnd?.({
              animated: true,
            });
        }, 120);
      } catch (error) {
        console.log(
          "Mesajlar getirilemedi:",
          error
        );

        Alert.alert(
          "Mesajlar",
          error.message
        );
      } finally {
        setChatLoading(false);
      }
    };

  /*
    ============================================================
    MESAJ GÖNDER
    ============================================================
  */

  const handleSendMessage =
    async () => {
      if (
        !selectedChatUser?.id
      ) {
        return;
      }

      const text =
        newMessage.trim();

      if (!text) {
        return;
      }

      /*
        Kullanıcı gönder tuşuna bastığında input'u hemen
        temizleyerek daha akıcı bir his veriyoruz.
      */

      setNewMessage("");

      try {
        const sent =
          await apiRequest(
            `/messages/${selectedChatUser.id}`,
            {
              method: "POST",

              body:
                JSON.stringify({
                  text,
                }),
            }
          );

        /*
          Backend yeni mesajı döndürüyorsa direkt ekle.
          Döndürmüyorsa konuşmayı tekrar getir.
        */

        if (sent?.id) {
          setChatMessages(
            (current) => [
              ...current,
              sent,
            ]
          );

          setTimeout(() => {
            chatScrollRef.current
              ?.scrollToEnd?.({
                animated: true,
              });
          }, 100);
        } else {
          await fetchMessages(
            selectedChatUser.id
          );
        }
      } catch (error) {
        /*
          Gönderilemediyse yazıyı geri getiriyoruz.
        */

        setNewMessage(text);

        Alert.alert(
          "Mesaj gönderilemedi",
          error.message
        );
      }
    };

  /*
    ============================================================
    MESAJLARI YENİLE
    ============================================================

    WebSocket kullanmadığımız için kullanıcı sohbet
    ekranındayken yenile butonuyla güncel mesajları alabilecek.

    Ayrıca ekran ilk açıldığında otomatik getiriliyor.
  */

  const refreshCurrentChat =
    async () => {
      if (
        selectedChatUser?.id
      ) {
        await fetchMessages(
          selectedChatUser.id
        );
      }
    };

  /*
    ============================================================
    PROFİL DÜZENLE
    ============================================================

    Profilde artık ikinci bir karanlık/aydınlık mod
    düğmesi YOK.

    Tema yalnızca header'daki ay/güneş düğmesinden
    değiştirilecek.
  */

  const openEditProfile =
    () => {
      setProfileName(
        user?.name || ""
      );

      setCurrentPassword("");
      setNewPassword("");

      setShowProfile(false);

      setShowEditProfile(
        true
      );
    };

  const handleUpdateProfile =
    async () => {
      if (
        !profileName.trim()
      ) {
        Alert.alert(
          "Profil",
          "Ad soyad boş bırakılamaz."
        );

        return;
      }

      if (
        newPassword &&
        newPassword.length < 8
      ) {
        Alert.alert(
          "Şifre",
          "Yeni şifre en az 8 karakter olmalıdır."
        );

        return;
      }

      if (
        newPassword &&
        !currentPassword
      ) {
        Alert.alert(
          "Şifre",
          "Yeni şifre belirlemek için mevcut şifreni yazmalısın."
        );

        return;
      }

      try {
        setLoading(true);

        const data =
          await apiRequest(
            "/user/profile",
            {
              method: "PUT",

              body:
                JSON.stringify({
                  name:
                    profileName.trim(),

                  currentPassword:
                    currentPassword ||
                    undefined,

                  newPassword:
                    newPassword ||
                    undefined,
                }),
            }
          );

        if (data?.user) {
          setUser(data.user);

          await AsyncStorage.setItem(
            "panovio_user",
            JSON.stringify(
              data.user
            )
          );
        }

        setShowEditProfile(
          false
        );

        Alert.alert(
          "Profil",
          "Profil bilgilerin güncellendi."
        );
      } catch (error) {
        Alert.alert(
          "Profil güncellenemedi",
          error.message
        );
      } finally {
        setLoading(false);
      }
    };

  /*
    ============================================================
    HESAP SİL
    ============================================================
  */

  const handleDeleteAccount =
    () => {
      Alert.alert(
        "Hesabı sil",
        "Hesabını silersen hesabın ve ilişkili verilerin kalıcı olarak kaldırılır. Devam etmek istiyor musun?",
        [
          {
            text: "Vazgeç",
            style: "cancel",
          },

          {
            text: "Hesabımı Sil",
            style:
              "destructive",

            onPress:
              async () => {
                try {
                  setLoading(
                    true
                  );

                  await apiRequest(
                    "/user/account",
                    {
                      method:
                        "DELETE",
                    }
                  );

                  await handleLogout();
                } catch (
                  error
                ) {
                  Alert.alert(
                    "Hesap silinemedi",
                    error.message
                  );
                } finally {
                  setLoading(
                    false
                  );
                }
              },
          },
        ]
      );
    };

  /*
    ============================================================
    GÖREV KARTI İÇİN YARDIMCILAR
    ============================================================
  */

  const getTasksForColumn =
    (columnId) =>
      filteredTasks.filter(
        (task) =>
          Number(
            task.columnId
          ) ===
          Number(columnId)
      );

  const getTaskColumnIndex =
    (task) =>
      columns.findIndex(
        (column) =>
          Number(column.id) ===
          Number(task.columnId)
      );

  const getMemberUser =
    (member) =>
      member?.user ||
      member ||
      null;

  /*
    ============================================================
    GÖREV KARTI
    ============================================================
  */

  const renderTaskCard =
    (task) => {
      const checklistProgress =
        calculateChecklistProgress(
          task.items || []
        );

      const overdue =
        isOverdue(task);

      const columnIndex =
        getTaskColumnIndex(
          task
        );

      return (
        <TouchableOpacity
          key={task.id}
          activeOpacity={0.86}
          onPress={() =>
            openTaskDetails(
              task
            )
          }
          style={[
            styles.taskCard,
            {
              backgroundColor:
                theme.surface,

              borderColor:
                overdue
                  ? "#EF4444"
                  : theme.border,
            },
          ]}
        >
          {!!task.labels?.length && (
            <View
              style={
                styles.taskLabelRow
              }
            >
              {task.labels
                .slice(0, 4)
                .map(
                  (label) => (
                    <View
                      key={
                        label.id
                      }
                      style={[
                        styles.taskLabelMini,
                        {
                          backgroundColor:
                            label.color ||
                            theme.primary,
                        },
                      ]}
                    />
                  )
                )}
            </View>
          )}

          <View
            style={
              styles.taskCardTop
            }
          >
            <Text
              numberOfLines={2}
              style={[
                styles.taskCardTitle,
                {
                  color:
                    theme.text,
                },
              ]}
            >
              {task.title}
            </Text>

            <PriorityBadge
              priority={
                task.priority
              }
              compact
            />
          </View>

          <View style={styles.taskInfoRows}>
            {!!task.dueDate && (
              <View style={[styles.taskInfoRow, { borderColor: theme.borderSoft }]}>
                <Text style={[styles.taskInfoLabel, { color: theme.muted }]}>Bitiş</Text>
                <Text
                  numberOfLines={1}
                  style={[styles.taskInfoValue, { color: overdue ? theme.danger : theme.text2 }]}
                >
                  {formatDate(task.dueDate)}{overdue ? " · Gecikti" : ""}
                </Text>
              </View>
            )}

            {!!task.items?.length && (
              <View style={[styles.taskInfoRow, { borderColor: theme.borderSoft }]}>
                <Text style={[styles.taskInfoLabel, { color: theme.muted }]}>Checklist</Text>
                <View style={styles.taskChecklistValue}>
                  <Text style={[styles.taskInfoValue, { color: checklistProgress === 100 ? theme.success : theme.text2 }]}>
                    {task.items.filter((item) => item.isCompleted).length}/{task.items.length}
                  </Text>
                  <View style={[styles.taskProgressTrack, { backgroundColor: theme.surface3 }]}>
                    <View
                      style={[
                        styles.taskProgressFill,
                        {
                          width: `${checklistProgress}%`,
                          backgroundColor: checklistProgress === 100 ? theme.success : theme.primary,
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
            )}

            <View style={[styles.taskInfoRow, styles.taskInfoRowLast, { borderColor: theme.borderSoft }]}>
              <Text style={[styles.taskInfoLabel, { color: theme.muted }]}>Atanan</Text>
              <View style={styles.taskAssigneeCompact}>
                <Avatar
                  name={task.assignedTo?.name || "Atanmamış"}
                  size={24}
                  backgroundColor={task.assignedTo ? "#1D4ED8" : "#64748B"}
                />
                <Text numberOfLines={1} style={[styles.taskAssigneeCompactText, { color: theme.text2 }]}>
                  {task.assignedTo?.name || "Atanmamış"}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    };

  /*
    ============================================================
    SÜTUN
    ============================================================
  */

  const renderColumn =
    (column) => {
      const columnTasks =
        getTasksForColumn(
          column.id
        );

      return (
        <View
          key={column.id}
          style={[
            styles.kanbanColumn,
            {
              width:
                columnWidth,

              backgroundColor:
                theme.surface2,

              borderColor:
                theme.border,
            },
          ]}
        >
          <View
            style={
              styles.columnHeader
            }
          >
            <View
              style={
                styles.columnTitleWrap
              }
            >
              <View
                style={[
                  styles.columnColorDot,
                  {
                    backgroundColor:
                      column.color ||
                      theme.primary,
                  },
                ]}
              />

              <Text
                numberOfLines={1}
                style={[
                  styles.columnTitle,
                  {
                    color:
                      theme.text,
                  },
                ]}
              >
                {column.title}
              </Text>

              <View
                style={[
                  styles.columnCount,
                  {
                    backgroundColor:
                      theme.surface3,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.columnCountText,
                    {
                      color:
                        theme.text2,
                    },
                  ]}
                >
                  {
                    columnTasks.length
                  }
                </Text>
              </View>
            </View>

            {isManager && (
              <TouchableOpacity
                /*
                  DİKKAT:
                  Burada artık + butonu yok.

                  Kullanıcının istediği gibi yalnızca
                  üç nokta menüsü var.
                */
                onPress={() =>
                  openColumnMenu(
                    column
                  )
                }
                style={
                  styles.columnMenuButton
                }
              >
                <Text
                  style={[
                    styles.columnMenuText,
                    {
                      color:
                        theme.text2,
                    },
                  ]}
                >
                  ⋮
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            nestedScrollEnabled
            showsVerticalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.columnTaskList
            }
          >
            {columnTasks.length >
            0 ? (
              columnTasks.map(
                renderTaskCard
              )
            ) : (
              <View
                style={[
                  styles.emptyColumn,
                  {
                    borderColor:
                      theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.emptyColumnText,
                    {
                      color:
                        theme.muted,
                    },
                  ]}
                >
                  Bu listede henüz görev yok.
                </Text>
              </View>
            )}
          </ScrollView>

          <TouchableOpacity
            onPress={() =>
              openCreateTask(
                column.id
              )
            }
            style={[
              styles.addCardButton,
              {
                borderColor:
                  theme.border,
              },
            ]}
          >
            <Text
              style={[
                styles.addCardButtonText,
                {
                  color:
                    theme.primary2,
                },
              ]}
            >
              ＋ Bir kart ekle
            </Text>
          </TouchableOpacity>
        </View>
      );
    };
      /*
    ============================================================
    UYGULAMA YÜKLENİRKEN
    ============================================================
  */

  if (appLoading) {
    return (
      <View
        style={[
          styles.fullScreenCenter,
          {
            backgroundColor:
              DARK.background,
          },
        ]}
      >
        <PanovioLogo />

        <ActivityIndicator
          size="large"
          color={DARK.primary2}
          style={{
            marginTop: 24,
          }}
        />

        <Text
          style={[
            styles.loadingText,
            {
              color:
                DARK.muted,
            },
          ]}
        >
          Panovio hazırlanıyor...
        </Text>
      </View>
    );
  }

  /*
    ============================================================
    GİRİŞ / KAYIT EKRANI
    ============================================================
  */

  if (!token || !user) {
    return (
      <KeyboardAvoidingView
        style={[
          styles.authRoot,
          {
            backgroundColor:
              theme.background,
          },
        ]}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <StatusBar
          barStyle={
            isDark
              ? "light-content"
              : "dark-content"
          }
          backgroundColor={
            theme.background
          }
        />

        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={
            styles.authScroll
          }
        >
          <View
            style={
              styles.authLogoArea
            }
          >
            <PanovioLogo textColor={theme.text} />

            <Text
              style={[
                styles.authSubtitle,
                {
                  color:
                    theme.muted,
                },
              ]}
            >
              Projelerini ve görevlerini
              tek bir yerde yönet.
            </Text>
          </View>

          <View
            style={[
              styles.authCard,
              {
                backgroundColor:
                  theme.surface,

                borderColor:
                  theme.border,
              },
            ]}
          >
            <Text
              style={[
                styles.authTitle,
                {
                  color:
                    theme.text,
                },
              ]}
            >
              {isLoginMode
                ? "Hesabına Giriş Yap"
                : "Panovio'ya katıl"}
            </Text>

            <Text
              style={[
                styles.authDescription,
                {
                  color:
                    theme.muted,
                },
              ]}
            >
              {isLoginMode
                ? "Panolarına devam etmek için hesabına giriş yap."
                : "Yeni hesabını oluşturarak ilk panonu hazırlamaya başla."}
            </Text>

            {isLoginMode && (
              <TouchableOpacity
                onPress={() => { resetForgotFlow(); setShowForgotModal(true); }}
                style={styles.forgotLink}
              >
                <Text style={[styles.forgotLinkText, { color: theme.primary2 }]}>
                  Şifremi unuttum?
                </Text>
              </TouchableOpacity>
            )}

            {!isLoginMode && (
              <>
                <Text
                  style={[
                    styles.inputLabel,
                    {
                      color:
                        theme.text2,
                    },
                  ]}
                >
                  Ad Soyad
                </Text>

                <TextInput
                  value={name}
                  onChangeText={
                    setName
                  }
                  placeholder="Ad Soyad"
                  placeholderTextColor={
                    theme.muted2
                  }
                  autoCapitalize="words"
                  style={[
                    styles.input,
                    {
                      color:
                        theme.text,

                      backgroundColor:
                        theme.surface2,

                      borderColor:
                        theme.border,
                    },
                  ]}
                />
              </>
            )}

            <Text
              style={[
                styles.inputLabel,
                {
                  color:
                    theme.text2,
                },
              ]}
            >
              E-posta
            </Text>

            <TextInput
              value={email}
              onChangeText={
                setEmail
              }
              placeholder="ornek@mail.com"
              placeholderTextColor={
                theme.muted2
              }
              autoCapitalize="none"
              keyboardType="email-address"
              style={[
                styles.input,
                {
                  color:
                    theme.text,

                  backgroundColor:
                    theme.surface2,

                  borderColor:
                    theme.border,
                },
              ]}
            />

            <Text
              style={[
                styles.inputLabel,
                {
                  color:
                    theme.text2,
                },
              ]}
            >
              Şifre
            </Text>

            <View
              style={[
                styles.passwordField,
                {
                  backgroundColor: theme.surface2,
                  borderColor: theme.border,
                },
              ]}
            >
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Şifren"
                placeholderTextColor={theme.muted2}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                style={[
                  styles.passwordInput,
                  { color: theme.text },
                ]}
              />

              <TouchableOpacity
                onPress={() => setShowPassword((value) => !value)}
                style={styles.passwordEyeButton}
                accessibilityLabel={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
              >
                {showPassword ? (
                  <EyeOff size={20} color={theme.muted} />
                ) : (
                  <Eye size={20} color={theme.muted} />
                )}
              </TouchableOpacity>
            </View>

            {!isLoginMode && (
              <>
                <Text
                  style={[
                    styles.inputLabel,
                    {
                      color:
                        theme.text2,
                    },
                  ]}
                >
                  Şifre Tekrar
                </Text>

                <View
                  style={[
                    styles.passwordField,
                    {
                      backgroundColor: theme.surface2,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Şifreni tekrar yaz"
                    placeholderTextColor={theme.muted2}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    style={[styles.passwordInput, { color: theme.text }]}
                  />

                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword((value) => !value)}
                    style={styles.passwordEyeButton}
                    accessibilityLabel={showConfirmPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} color={theme.muted} />
                    ) : (
                      <Eye size={20} color={theme.muted} />
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}

            {!!authMessage && (
              <View
                style={
                  styles.authMessage
                }
              >
                <Text
                  style={
                    styles.authMessageText
                  }
                >
                  {authMessage}
                </Text>
              </View>
            )}

            <TouchableOpacity
              disabled={loading}
              onPress={
                handleAuth
              }
              style={[
                styles.primaryButton,
                styles.authSubmitButton,
                {
                  backgroundColor:
                    theme.primary,
                },

                loading &&
                  styles.disabledButton,
              ]}
            >
              {loading ? (
                <ActivityIndicator
                  color="#FFFFFF"
                />
              ) : (
                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  {isLoginMode
                    ? "Giriş Yap"
                    : "Hesap Oluştur"}
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.demoSection}>
              <View style={[styles.demoDivider, { backgroundColor: theme.border }]} />
              <Text style={[styles.demoLabel, { color: theme.muted }]}>HIZLI KEŞİF</Text>
              <TouchableOpacity
                disabled={loading}
                onPress={() => handleDemoLogin("manager")}
                style={[styles.demoButton, { borderColor: theme.primary, backgroundColor: `${theme.primary}14` }]}
              >
                <Text style={[styles.demoButtonText, { color: theme.primary2 }]}>Yönetici Demoyu İncele</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={loading}
                onPress={() => handleDemoLogin("developer")}
                style={[styles.demoButton, { borderColor: theme.border, backgroundColor: theme.surface2 }]}
              >
                <Text style={[styles.demoButtonText, { color: theme.text2 }]}>Geliştirici Demoyu İncele</Text>
              </TouchableOpacity>
            </View>

            <View
              style={
                styles.authSwitchRow
              }
            >
              <Text
                style={{
                  color:
                    theme.muted,
                }}
              >
                {isLoginMode
                  ? "Hesabın yok mu?"
                  : "Zaten hesabın var mı?"}
              </Text>

              <TouchableOpacity
                onPress={() =>
                  changeAuthMode(
                    !isLoginMode
                  )
                }
              >
                <Text
                  style={[
                    styles.authSwitchText,
                    {
                      color:
                        theme.primary2,
                    },
                  ]}
                >
                  {isLoginMode
                    ? " Kayıt Ol"
                    : " Giriş Yap"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <Modal visible={showForgotModal} transparent animationType="slide" onRequestClose={() => setShowForgotModal(false)}>
          <View style={styles.modalBackdrop}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalKeyboard}>
              <View style={[styles.modalCard, styles.forgotModalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.forgotModalBrand}>
                  <PanovioLogo compact textColor={theme.text} />
                </View>
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.modalTitle, { color: theme.text }]}>Şifremi Unuttum</Text>
                    <Text style={[styles.modalSubtitle, { color: theme.muted }]}>
                      {forgotStep === 1 ? "E-posta adresine 6 haneli doğrulama kodu gönderelim." :
                       forgotStep === 2 ? "E-postana gelen 6 haneli kodu gir." :
                       forgotStep === 3 ? "Yeni şifreni belirle." : "Şifren başarıyla güncellendi."}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowForgotModal(false)} style={styles.modalCloseButton}>
                    <Text style={[styles.modalCloseText, { color: theme.muted }]}>×</Text>
                  </TouchableOpacity>
                </View>

                {forgotStep === 1 && (<>
                  <Text style={[styles.inputLabel, { color: theme.text2 }]}>E-posta</Text>
                  <TextInput value={forgotEmail} onChangeText={setForgotEmail} autoCapitalize="none" keyboardType="email-address" placeholder="ornek@mail.com" placeholderTextColor={theme.muted2} style={[styles.input,{color:theme.text,backgroundColor:theme.surface2,borderColor:theme.border}]} />
                  <TouchableOpacity disabled={forgotLoading} onPress={requestResetCode} style={[styles.primaryButton,{backgroundColor:theme.primary,marginTop:16}]}>
                    {forgotLoading ? <ActivityIndicator color="#fff"/> : <Text style={styles.primaryButtonText}>Doğrulama Kodu Gönder</Text>}
                  </TouchableOpacity>
                </>)}

                {forgotStep === 2 && (<>
                  <Text style={[styles.inputLabel, { color: theme.text2 }]}>6 Haneli Kod</Text>
                  <TextInput value={forgotCode} onChangeText={(v)=>setForgotCode(v.replace(/\D/g,"").slice(0,6))} keyboardType="number-pad" maxLength={6} placeholder="000000" placeholderTextColor={theme.muted2} style={[styles.input,styles.codeInput,{color:theme.text,backgroundColor:theme.surface2,borderColor:theme.border}]} />
                  <TouchableOpacity disabled={forgotLoading} onPress={verifyResetCode} style={[styles.primaryButton,{backgroundColor:theme.primary,marginTop:16}]}>
                    {forgotLoading ? <ActivityIndicator color="#fff"/> : <Text style={styles.primaryButtonText}>Kodu Doğrula</Text>}
                  </TouchableOpacity>
                </>)}

                {forgotStep === 3 && (<>
                  <Text style={[styles.inputLabel, { color: theme.text2 }]}>Yeni Şifre</Text>
                  <View style={[styles.passwordField,{backgroundColor:theme.surface2,borderColor:theme.border}]}>
                    <TextInput value={forgotNewPassword} onChangeText={setForgotNewPassword} secureTextEntry={!showForgotNewPassword} autoCapitalize="none" placeholder="En az 8 karakter" placeholderTextColor={theme.muted2} style={[styles.passwordInput,{color:theme.text}]} />
                    <TouchableOpacity onPress={()=>setShowForgotNewPassword(v=>!v)} style={styles.passwordEyeButton}>{showForgotNewPassword?<EyeOff size={20} color={theme.muted}/>:<Eye size={20} color={theme.muted}/>}</TouchableOpacity>
                  </View>
                  <Text style={[styles.inputLabel,styles.inputLabelSpacing,{color:theme.text2}]}>Yeni Şifre Tekrar</Text>
                  <View style={[styles.passwordField,{backgroundColor:theme.surface2,borderColor:theme.border}]}>
                    <TextInput value={forgotConfirmPassword} onChangeText={setForgotConfirmPassword} secureTextEntry={!showForgotConfirmPassword} autoCapitalize="none" placeholder="Şifreni tekrar yaz" placeholderTextColor={theme.muted2} style={[styles.passwordInput,{color:theme.text}]} />
                    <TouchableOpacity onPress={()=>setShowForgotConfirmPassword(v=>!v)} style={styles.passwordEyeButton}>{showForgotConfirmPassword?<EyeOff size={20} color={theme.muted}/>:<Eye size={20} color={theme.muted}/>}</TouchableOpacity>
                  </View>
                  <TouchableOpacity disabled={forgotLoading} onPress={resetPassword} style={[styles.primaryButton,{backgroundColor:theme.primary,marginTop:18}]}>
                    {forgotLoading ? <ActivityIndicator color="#fff"/> : <Text style={styles.primaryButtonText}>Şifreyi Güncelle</Text>}
                  </TouchableOpacity>
                </>)}

                {forgotStep === 4 && (
                  <TouchableOpacity onPress={()=>{setShowForgotModal(false);setIsLoginMode(true);setEmail(forgotEmail);}} style={[styles.primaryButton,{backgroundColor:theme.primary,marginTop:10}]}>
                    <Text style={styles.primaryButtonText}>Giriş Yap</Text>
                  </TouchableOpacity>
                )}

                {!!forgotMessage && <Text style={[styles.forgotMessage,{color:forgotStep===4?theme.success:theme.muted}]}>{forgotMessage}</Text>}
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    );
  }

  /*
    ============================================================
    MESAJLAR EKRANI
    ============================================================
  */

  const renderMessagesScreen =
    () => {
      /*
        Bir kullanıcı seçilmediyse
        ekip arkadaşlarının listesi.
      */

      if (!selectedChatUser) {
        const normalizedMessageSearch = messageSearchText.trim().toLocaleLowerCase("tr-TR");
        const filteredMessageUsers = messageUsers.filter((chatUser) =>
          !normalizedMessageSearch ||
          `${chatUser.name || ""} ${chatUser.email || ""}`.toLocaleLowerCase("tr-TR").includes(normalizedMessageSearch)
        );

        return (
          <View
            style={
              styles.screenContent
            }
          >
            <View
              style={
                styles.sectionHeadingRow
              }
            >
              <View>
                <Text
                  style={[
                    styles.screenTitle,
                    {
                      color:
                        theme.text,
                    },
                  ]}
                >
                  Ekip Sohbeti
                </Text>

                <Text
                  style={[
                    styles.screenSubtitle,
                    {
                      color:
                        theme.muted,
                    },
                  ]}
                >
                  Ekip arkadaşlarınla
                  iletişim kur.
                </Text>
              </View>

              <TouchableOpacity
                onPress={
                  fetchMessageUsers
                }
                style={[
                  styles.iconSquareButton,
                  {
                    borderColor:
                      theme.border,

                    backgroundColor:
                      theme.surface,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.iconSquareText,
                    {
                      color:
                        theme.text,
                    },
                  ]}
                >
                  ↻
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.messageSearchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.messageSearchIcon, { color: theme.muted }]}>⌕</Text>
              <TextInput
                value={messageSearchText}
                onChangeText={setMessageSearchText}
                placeholder="Ekip arkadaşını ara..."
                placeholderTextColor={theme.muted2}
                style={[styles.messageSearchInput, { color: theme.text }]}
              />
              {!!messageSearchText && (
                <TouchableOpacity onPress={() => setMessageSearchText("")}>
                  <Text style={[styles.messageSearchClear, { color: theme.muted }]}>×</Text>
                </TouchableOpacity>
              )}
            </View>

            {chatLoading &&
            !messageUsers.length ? (
              <View
                style={
                  styles.centerSection
                }
              >
                <ActivityIndicator
                  color={
                    theme.primary
                  }
                />
              </View>
            ) : filteredMessageUsers.length ===
              0 ? (
              <EmptyState
                icon="💬"
                title={messageUsers.length ? "Aramana uygun ekip arkadaşı yok" : "Mesajlaşabileceğin ekip arkadaşı yok"}
                description={messageUsers.length ? "Farklı bir isim veya e-posta ile tekrar ara." : "Ortak bir panoda çalıştığın ekip üyeleri burada görünür."}
                theme={theme}
              />
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={
                  false
                }
                contentContainerStyle={
                  styles.messageUserList
                }
              >
                {filteredMessageUsers.map(
                  (chatUser) => (
                    <TouchableOpacity
                      key={
                        chatUser.id
                      }
                      activeOpacity={
                        0.82
                      }
                      onPress={() =>
                        openChat(
                          chatUser
                        )
                      }
                      style={[
                        styles.messageUserCard,
                        {
                          backgroundColor:
                            theme.surface,

                          borderColor:
                            theme.border,
                        },
                      ]}
                    >
                      <Avatar
                        name={
                          chatUser.name
                        }
                        size={48}
                      />

                      <View
                        style={
                          styles.messageUserInfo
                        }
                      >
                        <Text
                          numberOfLines={
                            1
                          }
                          style={[
                            styles.messageUserName,
                            {
                              color:
                                theme.text,
                            },
                          ]}
                        >
                          {
                            chatUser.name
                          }
                        </Text>

                        <Text
                          numberOfLines={
                            1
                          }
                          style={[
                            styles.messageUserEmail,
                            {
                              color:
                                theme.muted,
                            },
                          ]}
                        >
                          {
                            chatUser.email
                          }
                        </Text>
                      </View>

                      <Text
                        style={[
                          styles.messageArrow,
                          {
                            color:
                              theme.muted,
                          },
                        ]}
                      >
                        ›
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </ScrollView>
            )}
          </View>
        );
      }

      /*
        Aktif sohbet.
      */

      return (
        <KeyboardAvoidingView
          style={
            styles.chatScreen
          }
          behavior={
            Platform.OS ===
            "ios"
              ? "padding"
              : "height"
          }
          keyboardVerticalOffset={
            0
          }
        >
          <View
            style={[
              styles.chatHeader,
              {
                backgroundColor:
                  theme.surface,

                borderColor:
                  theme.border,
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => {
                setSelectedChatUser(
                  null
                );

                setChatMessages(
                  []
                );
              }}
              style={
                styles.chatBackButton
              }
            >
              <Text
                style={[
                  styles.chatBackText,
                  {
                    color:
                      theme.text,
                  },
                ]}
              >
                ‹
              </Text>
            </TouchableOpacity>

            <Avatar
              name={
                selectedChatUser.name
              }
              size={38}
            />

            <View
              style={
                styles.chatHeaderInfo
              }
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.chatHeaderName,
                  {
                    color:
                      theme.text,
                  },
                ]}
              >
                {
                  selectedChatUser.name
                }
              </Text>

              <Text
                numberOfLines={1}
                style={[
                  styles.chatHeaderEmail,
                  {
                    color:
                      theme.muted,
                  },
                ]}
              >
                {
                  selectedChatUser.email
                }
              </Text>
            </View>

            <TouchableOpacity
              onPress={
                refreshCurrentChat
              }
              style={
                styles.chatRefreshButton
              }
            >
              <Text
                style={[
                  styles.chatRefreshText,
                  {
                    color:
                      theme.primary2,
                  },
                ]}
              >
                ↻
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={chatScrollRef}
            style={
              styles.chatMessages
            }
            contentContainerStyle={
              styles.chatMessagesContent
            }
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() =>
              chatScrollRef.current
                ?.scrollToEnd?.({
                  animated: false,
                })
            }
          >
            {chatLoading &&
            !chatMessages.length ? (
              <ActivityIndicator
                color={
                  theme.primary
                }
                style={{
                  marginTop: 30,
                }}
              />
            ) : chatMessages.length ===
              0 ? (
              <View
                style={
                  styles.emptyChat
                }
              >
                <Text
                  style={
                    styles.emptyChatIcon
                  }
                >
                  👋
                </Text>

                <Text
                  style={[
                    styles.emptyChatTitle,
                    {
                      color:
                        theme.text,
                    },
                  ]}
                >
                  Sohbeti başlat
                </Text>

                <Text
                  style={[
                    styles.emptyChatText,
                    {
                      color:
                        theme.muted,
                    },
                  ]}
                >
                  İlk mesajını
                  göndererek konuşmaya
                  başlayabilirsin.
                </Text>
              </View>
            ) : (
              chatMessages.map(
                (message) => {
                  const senderId =
                    message.senderId ||
                    message.sender?.id;

                  const mine =
                    Number(
                      senderId
                    ) ===
                    Number(
                      user.id
                    );

                  return (
                    <View
                      key={
                        message.id
                      }
                      style={[
                        styles.messageBubbleRow,

                        mine
                          ? styles.messageBubbleRowMine
                          : styles.messageBubbleRowOther,
                      ]}
                    >
                      <View
                        style={[
                          styles.messageBubble,

                          mine
                            ? {
                                backgroundColor:
                                  theme.primary,
                              }
                            : {
                                backgroundColor:
                                  theme.surface,

                                borderColor:
                                  theme.border,

                                borderWidth:
                                  1,
                              },
                        ]}
                      >
                        <Text
                          style={[
                            styles.messageBubbleText,
                            {
                              color:
                                mine
                                  ? "#FFFFFF"
                                  : theme.text,
                            },
                          ]}
                        >
                          {
                            message.text
                          }
                        </Text>

                        {!!message.createdAt && (
                          <Text
                            style={[
                              styles.messageTime,
                              {
                                color:
                                  mine
                                    ? "#E0F2FE"
                                    : theme.muted,
                              },
                            ]}
                          >
                            {new Date(
                              message.createdAt
                            ).toLocaleTimeString(
                              "tr-TR",
                              {
                                hour:
                                  "2-digit",
                                minute:
                                  "2-digit",
                              }
                            )}
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                }
              )
            )}
          </ScrollView>

          <View
            style={[
              styles.chatComposer,
              {
                backgroundColor:
                  theme.surface,

                borderColor:
                  theme.border,

                paddingBottom:
                  Platform.OS === "android" && !keyboardVisible
                    ? 52
                    : 9,

                minHeight:
                  Platform.OS === "android" && !keyboardVisible
                    ? 110
                    : 67,
              },
            ]}
          >
            <TextInput
              value={newMessage}
              onChangeText={
                setNewMessage
              }
              placeholder="Mesaj yaz..."
              placeholderTextColor={
                theme.muted2
              }
              multiline
              maxLength={2000}
              style={[
                styles.chatInput,
                {
                  color:
                    theme.text,

                  backgroundColor:
                    theme.surface2,

                  borderColor:
                    theme.border,
                },
              ]}
            />

            <TouchableOpacity
              onPress={
                handleSendMessage
              }
              disabled={
                !newMessage.trim()
              }
              style={[
                styles.sendButton,
                {
                  backgroundColor:
                    newMessage.trim()
                      ? theme.primary
                      : theme.border,
                },
              ]}
            >
              <Text
                style={
                  styles.sendButtonText
                }
              >
                ➤
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      );
    };

  /*
    ============================================================
    PROFİL EKRANI
    ============================================================
  */

  const renderProfileScreen =
    () => {
      const assignedCount =
        tasks.filter(
          (task) =>
            Number(
              task.assignedToId ||
                task.assignedTo
                  ?.id
            ) ===
            Number(user.id)
        ).length;

      return (
        <ScrollView
          style={
            styles.screenContent
          }
          showsVerticalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.profileScreenContent
          }
        >
          <Text
            style={[
              styles.screenTitle,
              {
                color:
                  theme.text,
              },
            ]}
          >
            Profilim
          </Text>

          <View
            style={[
              styles.profileHero,
              {
                backgroundColor:
                  theme.surface,

                borderColor:
                  theme.border,
              },
            ]}
          >
            <Avatar
              name={user.name}
              size={76}
              backgroundColor={
                "#1D4ED8"
              }
            />

            <Text
              style={[
                styles.profileName,
                {
                  color:
                    theme.text,
                },
              ]}
            >
              {user.name}
            </Text>

            <Text
              style={[
                styles.profileEmail,
                {
                  color:
                    theme.muted,
                },
              ]}
            >
              {user.email}
            </Text>

            <View style={[styles.profileRoleBadge, { borderColor: `${theme.primary}66`, backgroundColor: `${theme.primary}14` }]}>
              <Text style={[styles.profileRoleText, { color: theme.primary2 }]}>
                Bu panodaki rolünüz: {isManager ? "Yönetici" : "Geliştirici"}
              </Text>
            </View>
          </View>

          <View
            style={
              styles.profileStatsRow
            }
          >
            <View
              style={[
                styles.profileStatCard,
                {
                  backgroundColor:
                    theme.surface,

                  borderColor:
                    theme.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.profileStatValue,
                  {
                    color:
                      theme.text,
                  },
                ]}
              >
                {projects.length}
              </Text>

              <Text
                style={[
                  styles.profileStatLabel,
                  {
                    color:
                      theme.muted,
                  },
                ]}
              >
                Panolarım
              </Text>
            </View>

            <View
              style={[
                styles.profileStatCard,
                {
                  backgroundColor:
                    theme.surface,

                  borderColor:
                    theme.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.profileStatValue,
                  {
                    color:
                      theme.text,
                  },
                ]}
              >
                {assignedCount}
              </Text>

              <Text
                style={[
                  styles.profileStatLabel,
                  {
                    color:
                      theme.muted,
                  },
                ]}
              >
                Bana Atanan
              </Text>
            </View>
          </View>

          <View style={[styles.profileSummaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.profileSummaryTitle, { color: theme.text }]}>Çalışma Özetim</Text>
            <View style={styles.profileSummaryRow}>
              <View style={styles.profileSummaryItem}>
                <Text style={[styles.profileSummaryValue, { color: theme.primary2 }]}>{statistics.total}</Text>
                <Text style={[styles.profileSummaryLabel, { color: theme.muted }]}>Toplam Görev</Text>
              </View>
              <View style={styles.profileSummaryItem}>
                <Text style={[styles.profileSummaryValue, { color: theme.success }]}>{statistics.completed}</Text>
                <Text style={[styles.profileSummaryLabel, { color: theme.muted }]}>Yapılan</Text>
              </View>
              <View style={styles.profileSummaryItem}>
                <Text style={[styles.profileSummaryValue, { color: theme.warning }]}>{Math.max(statistics.total - statistics.completed, 0)}</Text>
                <Text style={[styles.profileSummaryLabel, { color: theme.muted }]}>Yapılmayan</Text>
              </View>
            </View>
          </View>

          <View
            style={[
              styles.profileMenuCard,
              {
                backgroundColor:
                  theme.surface,

                borderColor:
                  theme.border,
              },
            ]}
          >
            <TouchableOpacity
              onPress={
                openEditProfile
              }
              style={
                styles.profileMenuItem
              }
            >
              <Text
                style={
                  styles.profileMenuIcon
                }
              >
                👤
              </Text>

              <View
                style={
                  styles.profileMenuInfo
                }
              >
                <Text
                  style={[
                    styles.profileMenuTitle,
                    {
                      color:
                        theme.text,
                    },
                  ]}
                >
                  Hesap Bilgileri
                </Text>

                <Text
                  style={[
                    styles.profileMenuDescription,
                    {
                      color:
                        theme.muted,
                    },
                  ]}
                >
                  Adını ve şifreni
                  düzenle
                </Text>
              </View>

              <Text
                style={{
                  color:
                    theme.muted,
                  fontSize: 24,
                }}
              >
                ›
              </Text>
            </TouchableOpacity>

            {/*
              Burada tema değiştirme YOK.

              Kullanıcının istediği gibi yalnızca
              header'daki ay/güneş kullanılacak.
            */}

            <TouchableOpacity
              onPress={() =>
                Alert.alert(
                  "Çıkış Yap",
                  "Hesabından çıkmak istiyor musun?",
                  [
                    {
                      text:
                        "Vazgeç",
                      style:
                        "cancel",
                    },

                    {
                      text:
                        "Çıkış Yap",
                      onPress:
                        handleLogout,
                    },
                  ]
                )
              }
              style={[
                styles.profileMenuItem,
                styles.profileMenuBorder,
                {
                  borderColor:
                    theme.borderSoft,
                },
              ]}
            >
              <Text
                style={[styles.profileMenuIcon, { color: theme.danger }]}
              >
                ↪
              </Text>

              <View
                style={
                  styles.profileMenuInfo
                }
              >
                <Text
                  style={[
                    styles.profileMenuTitle,
                    {
                      color: theme.danger,
                    },
                  ]}
                >
                  Çıkış Yap
                </Text>

                <Text
                  style={[
                    styles.profileMenuDescription,
                    {
                      color:
                        theme.muted,
                    },
                  ]}
                >
                  Panovio oturumunu
                  kapat
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      );
    };

  /*
    ============================================================
    PANOLAR EKRANI
    ============================================================
  */

  const renderBoardsScreen =
    () => {
      return (
        <ScrollView
          style={
            styles.boardScreen
          }
          showsVerticalScrollIndicator={
            false
          }
          refreshControl={
            <RefreshControl
              refreshing={
                refreshing
              }
              onRefresh={
                handleRefresh
              }
              tintColor={
                theme.primary
              }
              colors={[
                theme.primary,
              ]}
            />
          }
          contentContainerStyle={
            styles.boardScreenContent
          }
        >
          {/*
            ----------------------------------------------------
            KARŞILAMA + YENİ PANO
            ----------------------------------------------------
          */}

          <View
            style={
              styles.welcomeRow
            }
          >
            <View
              style={
                styles.welcomeInfo
              }
            >
              <Text
                style={[
                  styles.welcomeTitle,
                  {
                    color:
                      theme.text,
                  },
                ]}
              >
                Merhaba,{" "}
                {user.name
                  ?.split(" ")[0] ||
                  "Kullanıcı"}
              </Text>

              <Text
                style={[
                  styles.welcomeSubtitle,
                  {
                    color:
                      theme.muted,
                  },
                ]}
              >
                Bugünkü görevlerine
                göz atalım.
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                setProjectTitle(
                  ""
                );

                setProjectColor(
                  BOARD_COLORS[1]
                    .value
                );

                setShowCreateProject(
                  true
                );
              }}
              style={[
                styles.newBoardButton,
                {
                  backgroundColor:
                    theme.primary,
                },
              ]}
            >
              <Text
                style={
                  styles.newBoardButtonText
                }
              >
                ＋ Pano
              </Text>
            </TouchableOpacity>
          </View>

          {/*
            ----------------------------------------------------
            PANO SEKMELERİ
            ----------------------------------------------------
          */}

          {projects.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.projectTabs
              }
            >
              {projects.map(
                (project) => {
                  const active =
                    project.id ===
                    activeProjectId;

                  return (
                    <TouchableOpacity
                      key={
                        project.id
                      }
                      onPress={() =>
                        setActiveProjectId(
                          project.id
                        )
                      }
                      style={[
                        styles.projectTab,
                        {
                          backgroundColor:
                            active
                              ? theme.primary
                              : theme.surface,

                          borderColor:
                            active
                              ? theme.primary
                              : theme.border,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.projectTabColor,
                          {
                            backgroundColor:
                              /^#[0-9A-Fa-f]{6}$/.test(
                                String(
                                  project.background ||
                                    ""
                                )
                              )
                                ? project.background
                                : "#0EA5E9",
                          },
                        ]}
                      />

                      <Text
                        numberOfLines={
                          1
                        }
                        style={[
                          styles.projectTabText,
                          {
                            color:
                              active
                                ? "#FFFFFF"
                                : theme.text2,
                          },
                        ]}
                      >
                        {
                          project.title
                        }
                      </Text>
                    </TouchableOpacity>
                  );
                }
              )}
            </ScrollView>
          )}

          {/*
            ----------------------------------------------------
            PANO YOK
            ----------------------------------------------------
          */}

          {projects.length === 0 ? (
            <EmptyState
              icon="🗂️"
              title="İlk panonu oluştur"
              description="Projelerini ve görevlerini düzenlemek için yeni bir pano oluştur."
              buttonText="＋ Yeni Pano"
              onPress={() =>
                setShowCreateProject(
                  true
                )
              }
              theme={theme}
            />
          ) : !activeProject ? (
            <View
              style={
                styles.centerSection
              }
            >
              <ActivityIndicator
                color={
                  theme.primary
                }
              />
            </View>
          ) : (
            <>
              {/*
                ------------------------------------------------
                AKTİF PANO ÖZETİ
                ------------------------------------------------
              */}

              <View
                style={[
                  styles.boardHero,
                  {
                    backgroundColor: /^#[0-9A-Fa-f]{6}$/.test(String(activeProject.background || ""))
                      ? activeProject.background
                      : theme.primary,
                    borderColor: "rgba(255,255,255,0.20)",
                  },
                ]}
              >
                <View style={[styles.boardHeroAccent, { backgroundColor: "rgba(255,255,255,0.32)" }]} />
                <View
                  style={
                    styles.boardHeroOverlay
                  }
                >
                  <View
                    style={
                      styles.boardHeroTop
                    }
                  >
                    <View
                      style={
                        styles.boardHeroInfo
                      }
                    >
                      <Text
                        numberOfLines={
                          2
                        }
                        style={[styles.boardHeroTitle, { color: "#FFFFFF" }]}
                      >
                        {
                          activeProject.title
                        }
                      </Text>

                      <Text
                        style={[styles.boardHeroRole, { color: "#E2E8F0" }]}
                      >
                        {isManager
                          ? "Pano Yöneticisi"
                          : "Ekip Üyesi"}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() =>
                        setShowBoardMenu(
                          true
                        )
                      }
                      style={
                        styles.boardHeroMenu
                      }
                      accessibilityLabel="Pano işlemleri"
                    >
                      <Text
                        style={
                          styles.boardHeroMenuText
                        }
                      >
                        ⋮
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View
                    style={
                      styles.boardHeroStats
                    }
                  >
                    <View>
                      <Text
                        style={
                          styles.boardHeroStatValue
                        }
                      >
                        {
                          statistics.total
                        }
                      </Text>

                      <Text
                        style={
                          styles.boardHeroStatLabel
                        }
                      >
                        Görev
                      </Text>
                    </View>

                    <View>
                      <Text
                        style={
                          styles.boardHeroStatValue
                        }
                      >
                        {
                          columns.length
                        }
                      </Text>

                      <Text
                        style={
                          styles.boardHeroStatLabel
                        }
                      >
                        Liste
                      </Text>
                    </View>

                    <View>
                      <Text
                        style={
                          styles.boardHeroStatValue
                        }
                      >
                        {
                          members.length
                        }
                      </Text>

                      <Text
                        style={
                          styles.boardHeroStatLabel
                        }
                      >
                        Üye
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/*
                ------------------------------------------------
                GENEL İLERLEME
                ------------------------------------------------
              */}

              <View
                style={[
                  styles.progressCard,
                  {
                    backgroundColor:
                      theme.surface,

                    borderColor:
                      theme.border,
                  },
                ]}
              >
                <View
                  style={
                    styles.progressHeader
                  }
                >
                  <Text
                    style={[
                      styles.progressTitle,
                      {
                        color:
                          theme.text,
                      },
                    ]}
                  >
                    Genel İlerleme
                  </Text>

                  <Text
                    style={[
                      styles.progressPercent,
                      {
                        color:
                          theme.primary2,
                      },
                    ]}
                  >
                    {
                      progressPercent
                    }
                    %
                  </Text>
                </View>

                <View
                  style={[
                    styles.progressTrack,
                    {
                      backgroundColor:
                        theme.borderSoft,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(
                          progressPercent,
                          100
                        )}%`,

                        backgroundColor:
                          theme.primary,
                      },
                    ]}
                  />
                </View>
              </View>

              {/*
                ------------------------------------------------
                ARAMA
                ------------------------------------------------
              */}

              <View
                style={[
                  styles.searchBox,
                  {
                    backgroundColor:
                      theme.surface,

                    borderColor:
                      theme.border,
                  },
                ]}
              >
                <Text
                  style={
                    styles.searchIcon
                  }
                >
                  ⌕
                </Text>

                <TextInput
                  value={
                    searchText
                  }
                  onChangeText={
                    setSearchText
                  }
                  placeholder="Görev ara..."
                  placeholderTextColor={
                    theme.muted2
                  }
                  style={[
                    styles.searchInput,
                    {
                      color:
                        theme.text,
                    },
                  ]}
                />

                {!!searchText && (
                  <TouchableOpacity
                    onPress={() =>
                      setSearchText(
                        ""
                      )
                    }
                  >
                    <Text
                      style={{
                        color:
                          theme.muted,
                        fontSize: 18,
                      }}
                    >
                      ×
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/*
                ------------------------------------------------
                ARAÇ ÇUBUĞU

                Web ile aynı temel mantık:
                Filtreler / Bana Ait
                ------------------------------------------------
              */}

              <View
                style={
                  styles.toolbar
                }
              >
                <TouchableOpacity
                  onPress={() =>
                    setShowFilters(
                      true
                    )
                  }
                  style={[
                    styles.toolbarButton,
                    {
                      backgroundColor:
                        priorityFilter !==
                          "all" ||
                        dateFilter !==
                          "all"
                          ? theme.surface3
                          : theme.surface,

                      borderColor:
                        priorityFilter !==
                          "all" ||
                        dateFilter !==
                          "all"
                          ? theme.primary
                          : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.toolbarButtonText,
                      {
                        color:
                          theme.text2,
                      },
                    ]}
                  >
                    ⚙ Filtreler
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() =>
                    setOnlyMine(
                      (current) =>
                        !current
                    )
                  }
                  style={[
                    styles.toolbarButton,
                    {
                      backgroundColor:
                        onlyMine
                          ? theme.primary
                          : theme.surface,

                      borderColor:
                        onlyMine
                          ? theme.primary
                          : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.toolbarButtonText,
                      {
                        color:
                          onlyMine
                            ? "#FFFFFF"
                            : theme.text2,
                      },
                    ]}
                  >
                    👤 Bana Ait
                  </Text>
                </TouchableOpacity>

              </View>

              {/*
                ------------------------------------------------
                AKTİF FİLTRE ÖZETİ
                ------------------------------------------------
              */}

              {(priorityFilter !==
                "all" ||
                dateFilter !==
                  "all" ||
                onlyMine) && (
                <View
                  style={
                    styles.activeFiltersRow
                  }
                >
                  <Text
                    style={[
                      styles.activeFiltersText,
                      {
                        color:
                          theme.muted,
                      },
                    ]}
                  >
                    {
                      filteredTasks.length
                    }{" "}
                    görev gösteriliyor
                  </Text>

                  <TouchableOpacity
                    onPress={
                      clearFilters
                    }
                  >
                    <Text
                      style={[
                        styles.clearFiltersText,
                        {
                          color:
                            theme.primary2,
                        },
                      ]}
                    >
                      Filtreleri temizle
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/*
                ------------------------------------------------
                KANBAN
                ------------------------------------------------
              */}

              {loading &&
              !columns.length ? (
                <View
                  style={
                    styles.centerSection
                  }
                >
                  <ActivityIndicator
                    size="large"
                    color={
                      theme.primary
                    }
                  />
                </View>
              ) : columns.length ===
                0 ? (
                <EmptyState
                  icon="📑"
                  title="Bu panoda liste yok"
                  description={
                    isManager
                      ? "İlk görev listesini oluşturarak panonu hazırlayabilirsin."
                      : "Pano yöneticisi henüz bir liste oluşturmadı."
                  }
                  buttonText={
                    isManager
                      ? "＋ Liste Oluştur"
                      : undefined
                  }
                  onPress={
                    isManager
                      ? openCreateColumn
                      : undefined
                  }
                  theme={theme}
                />
              ) : (
                <ScrollView
                  horizontal
                  nestedScrollEnabled
                  showsHorizontalScrollIndicator={
                    false
                  }
                  snapToInterval={
                    columnWidth +
                    14
                  }
                  decelerationRate="fast"
                  contentContainerStyle={
                    styles.kanbanScroll
                  }
                >
                  {columns.map(
                    renderColumn
                  )}

                  {isManager && (
                    <TouchableOpacity
                      onPress={
                        openCreateColumn
                      }
                      style={[
                        styles.addColumnCard,
                        {
                          width:
                            columnWidth,

                          backgroundColor:
                            theme.surface,

                          borderColor:
                            theme.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.addColumnIcon,
                          {
                            color:
                              theme.primary2,
                          },
                        ]}
                      >
                        ＋
                      </Text>

                      <Text
                        style={[
                          styles.addColumnTitle,
                          {
                            color:
                              theme.text,
                          },
                        ]}
                      >
                        Başka bir liste ekle
                      </Text>

                      <Text
                        style={[
                          styles.addColumnDescription,
                          {
                            color:
                              theme.muted,
                          },
                        ]}
                      >
                        İş akışına yeni bir
                        aşama ekle.
                      </Text>
                    </TouchableOpacity>
                  )}
                </ScrollView>
              )}
            </>
          )}
        </ScrollView>
      );
    };

  /*
    ============================================================
    ANA UYGULAMA
    ============================================================
  */

  return (
    <View
      style={[
        styles.appRoot,
        {
          backgroundColor:
            theme.background,
        },
      ]}
    >
      <StatusBar
        barStyle={
          isDark
            ? "light-content"
            : "dark-content"
        }
        backgroundColor={
          theme.background2
        }
      />

      {/*
        Android'de deprecated SafeAreaView kullanmıyoruz.

        StatusBar.currentHeight kadar boşluk bırakarak
        logo ve butonların durum çubuğuna yapışmasını
        engelliyoruz.
      */}

      <View
        style={{
          height:
            Platform.OS ===
            "android"
              ? StatusBar.currentHeight ||
                0
              : 0,

          backgroundColor:
            theme.background2,
        }}
      />

      {/*
        ========================================================
        ÜST HEADER
        ========================================================
      */}

      <View
        style={[
          styles.mainHeader,
          {
            backgroundColor:
              theme.background2,

            borderColor:
              theme.borderSoft,
          },
        ]}
      >
        <PanovioLogo
          compact
          textColor={theme.text}
        />

        <View
          style={
            styles.headerActions
          }
        >
          <TouchableOpacity
            /*
              Kullanıcının sevdiği tek tema butonu.

              Profil içinde ikinci bir tema seçeneği yok.
            */
            onPress={() =>
              setIsDark(
                (current) =>
                  !current
              )
            }
            style={[
              styles.headerIconButton,
              {
                backgroundColor:
                  theme.surface,

                borderColor:
                  theme.border,
              },
            ]}
          >
            <Text
              style={
                styles.headerThemeIcon
              }
            >
              {isDark
                ? "☀️"
                : "🌙"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              setCurrentScreen(
                "profile"
              )
            }
          >
            <Avatar
              name={
                user.name
              }
              size={38}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/*
        ========================================================
        SAYFA
        ========================================================
      */}

      <View
        style={
          styles.mainBody
        }
      >
        {currentScreen ===
          "boards" &&
          renderBoardsScreen()}

        {currentScreen ===
          "messages" &&
          renderMessagesScreen()}

        {currentScreen ===
          "profile" &&
          renderProfileScreen()}
      </View>

      {/*
        ========================================================
        ALT NAVİGASYON
        ========================================================
      */}

      {!selectedChatUser && (
        <View
          style={[
            styles.bottomNav,
            {
              backgroundColor:
                theme.background2,

              borderColor:
                theme.border,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() =>
              setCurrentScreen(
                "boards"
              )
            }
            style={
              styles.bottomNavItem
            }
          >
            <Text
              style={[
                styles.bottomNavIcon,
                {
                  color:
                    currentScreen ===
                    "boards"
                      ? theme.primary2
                      : theme.muted,
                },
              ]}
            >
              ▦
            </Text>

            <Text
              style={[
                styles.bottomNavLabel,
                {
                  color:
                    currentScreen ===
                    "boards"
                      ? theme.primary2
                      : theme.muted,
                },
              ]}
            >
              Panolar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setCurrentScreen(
                "messages"
              );

              setSelectedChatUser(
                null
              );

              fetchMessageUsers();
            }}
            style={
              styles.bottomNavItem
            }
          >
            <Text
              style={[
                styles.bottomNavIcon,
                {
                  color:
                    currentScreen ===
                    "messages"
                      ? theme.primary2
                      : theme.muted,
                },
              ]}
            >
              ◉
            </Text>

            <Text
              style={[
                styles.bottomNavLabel,
                {
                  color:
                    currentScreen ===
                    "messages"
                      ? theme.primary2
                      : theme.muted,
                },
              ]}
            >
              Mesajlar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              setCurrentScreen(
                "profile"
              )
            }
            style={
              styles.bottomNavItem
            }
          >
            <Text
              style={[
                styles.bottomNavIcon,
                {
                  color:
                    currentScreen ===
                    "profile"
                      ? theme.primary2
                      : theme.muted,
                },
              ]}
            >
              ●
            </Text>

            <Text
              style={[
                styles.bottomNavLabel,
                {
                  color:
                    currentScreen ===
                    "profile"
                      ? theme.primary2
                      : theme.muted,
                },
              ]}
            >
              Profil
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/*
        ========================================================
        PANO MENÜSÜ — ⋮
        ========================================================
      */}

      <Modal
        visible={
          showBoardMenu
        }
        transparent
        animationType="fade"
        onRequestClose={() =>
          setShowBoardMenu(
            false
          )
        }
      >
        <Pressable
          style={
            styles.modalBackdrop
          }
          onPress={() =>
            setShowBoardMenu(
              false
            )
          }
        >
          <Pressable
            onPress={() => {}}
            style={[
              styles.actionMenu,
              {
                backgroundColor:
                  theme.surface,

                borderColor:
                  theme.border,
              },
            ]}
          >
            <View
              style={
                styles.actionMenuHeader
              }
            >
              <View>
                <Text
                  style={[
                    styles.actionMenuTitle,
                    {
                      color:
                        theme.text,
                    },
                  ]}
                >
                  Pano İşlemleri
                </Text>

                <Text
                  numberOfLines={1}
                  style={[
                    styles.actionMenuSubtitle,
                    {
                      color:
                        theme.muted,
                    },
                  ]}
                >
                  {
                    activeProject?.title
                  }
                </Text>
              </View>

              <TouchableOpacity
                onPress={() =>
                  setShowBoardMenu(
                    false
                  )
                }
              >
                <Text
                  style={[
                    styles.modalCloseText,
                    {
                      color:
                        theme.muted,
                    },
                  ]}
                >
                  ×
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() =>
                openCreateTask()
              }
              style={
                styles.actionMenuItem
              }
            >
              <Text
                style={
                  styles.actionMenuIcon
                }
              >
                ＋
              </Text>

              <View
                style={
                  styles.actionMenuInfo
                }
              >
                <Text
                  style={[
                    styles.actionMenuItemTitle,
                    {
                      color:
                        theme.text,
                    },
                  ]}
                >
                  Yeni Görev Oluştur
                </Text>

                <Text
                  style={[
                    styles.actionMenuItemDescription,
                    {
                      color:
                        theme.muted,
                    },
                  ]}
                >
                  Panoya yeni bir görev
                  kartı ekle
                </Text>
              </View>
            </TouchableOpacity>

            {isManager && (
              <TouchableOpacity
                onPress={
                  openInviteMember
                }
                style={
                  styles.actionMenuItem
                }
              >
                <Text
                  style={
                    styles.actionMenuIcon
                  }
                >
                  👥
                </Text>

                <View
                  style={
                    styles.actionMenuInfo
                  }
                >
                  <Text
                    style={[
                      styles.actionMenuItemTitle,
                      {
                        color:
                          theme.text,
                      },
                    ]}
                  >
                    Üye Davet Et
                  </Text>

                  <Text
                    style={[
                      styles.actionMenuItemDescription,
                      {
                        color:
                          theme.muted,
                      },
                    ]}
                  >
                    Ekibine yeni bir
                    kullanıcı ekle
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => {
                setShowBoardMenu(
                  false
                );

                setShowStatistics(
                  true
                );
              }}
              style={
                styles.actionMenuItem
              }
            >
              <Text
                style={
                  styles.actionMenuIcon
                }
              >
                📊
              </Text>

              <View
                style={
                  styles.actionMenuInfo
                }
              >
                <Text
                  style={[
                    styles.actionMenuItemTitle,
                    {
                      color:
                        theme.text,
                    },
                  ]}
                >
                  İstatistikler
                </Text>

                <Text
                  style={[
                    styles.actionMenuItemDescription,
                    {
                      color:
                        theme.muted,
                    },
                  ]}
                >
                  Panonun görev
                  dağılımını incele
                </Text>
              </View>
            </TouchableOpacity>

            {isManager && (
              <>
                <View
                  style={[
                    styles.actionMenuDivider,
                    {
                      backgroundColor:
                        theme.borderSoft,
                    },
                  ]}
                />

                <TouchableOpacity
                  onPress={
                    openEditBoard
                  }
                  style={
                    styles.actionMenuItem
                  }
                >
                  <Text
                    style={
                      styles.actionMenuIcon
                    }
                  >
                    ✎
                  </Text>

                  <View
                    style={
                      styles.actionMenuInfo
                    }
                  >
                    <Text
                      style={[
                        styles.actionMenuItemTitle,
                        {
                          color:
                            theme.text,
                        },
                      ]}
                    >
                      Panoyu Düzenle
                    </Text>

                    <Text
                      style={[
                        styles.actionMenuItemDescription,
                        {
                          color:
                            theme.muted,
                        },
                      ]}
                    >
                      Pano adını veya
                      rengini değiştir
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setShowBoardMenu(
                      false
                    );

                    openCreateColumn();
                  }}
                  style={
                    styles.actionMenuItem
                  }
                >
                  <Text
                    style={
                      styles.actionMenuIcon
                    }
                  >
                    ▤
                  </Text>

                  <View
                    style={
                      styles.actionMenuInfo
                    }
                  >
                    <Text
                      style={[
                        styles.actionMenuItemTitle,
                        {
                          color:
                            theme.text,
                        },
                      ]}
                    >
                      Yeni Liste
                    </Text>

                    <Text
                      style={[
                        styles.actionMenuItemDescription,
                        {
                          color:
                            theme.muted,
                        },
                      ]}
                    >
                      Panoya yeni bir
                      sütun ekle
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setShowBoardMenu(
                      false
                    );

                    handleDeleteBoard();
                  }}
                  style={
                    styles.actionMenuItem
                  }
                >
                  <Text
                    style={
                      styles.actionMenuIcon
                    }
                  >
                    🗑
                  </Text>

                  <View
                    style={
                      styles.actionMenuInfo
                    }
                  >
                    <Text
                      style={[
                        styles.actionMenuItemTitle,
                        {
                          color:
                            theme.danger,
                        },
                      ]}
                    >
                      Panoyu Sil
                    </Text>

                    <Text
                      style={[
                        styles.actionMenuItemDescription,
                        {
                          color:
                            theme.muted,
                        },
                      ]}
                    >
                      Bu panoyu kalıcı
                      olarak kaldır
                    </Text>
                  </View>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
            {/*
        ========================================================
        YENİ PANO MODALI
        ========================================================
      */}

      <Modal
        visible={showCreateProject}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setShowCreateProject(false)
        }
      >
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView
            behavior={
              Platform.OS === "ios"
                ? "padding"
                : undefined
            }
            style={styles.modalKeyboard}
          >
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderInfo}>
                  <Text
                    style={[
                      styles.modalTitle,
                      { color: theme.text },
                    ]}
                  >
                    Yeni Pano
                  </Text>

                  <Text
                    style={[
                      styles.modalSubtitle,
                      { color: theme.muted },
                    ]}
                  >
                    Projen için yeni bir çalışma alanı oluştur.
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() =>
                    setShowCreateProject(false)
                  }
                >
                  <Text
                    style={[
                      styles.modalCloseText,
                      { color: theme.muted },
                    ]}
                  >
                    ×
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <Text
                  style={[
                    styles.inputLabel,
                    { color: theme.text2 },
                  ]}
                >
                  Pano Adı
                </Text>

                <TextInput
                  value={projectTitle}
                  onChangeText={setProjectTitle}
                  placeholder="Örn. Mobil Uygulama Projesi"
                  placeholderTextColor={theme.muted2}
                  maxLength={80}
                  style={[
                    styles.input,
                    {
                      color: theme.text,
                      backgroundColor: theme.surface2,
                      borderColor: theme.border,
                    },
                  ]}
                />

                <Text
                  style={[
                    styles.inputLabel,
                    styles.inputLabelSpacing,
                    { color: theme.text2 },
                  ]}
                >
                  Pano Rengi
                </Text>

                <Text
                  style={[
                    styles.helperText,
                    { color: theme.muted },
                  ]}
                >
                  Kod yazmana gerek yok. Beğendiğin renge dokun.
                </Text>

                <View style={styles.colorGrid}>
                  {BOARD_COLORS.map((color) => {
                    const selected =
                      projectColor === color.value;

                    return (
                      <TouchableOpacity
                        key={color.value}
                        onPress={() =>
                          setProjectColor(color.value)
                        }
                        activeOpacity={0.8}
                        style={styles.colorOptionWrap}
                      >
                        <View
                          style={[
                            styles.colorOption,
                            {
                              backgroundColor: color.value,
                            },
                            selected &&
                              styles.colorOptionSelected,
                          ]}
                        >
                          {selected && (
                            <Text
                              style={styles.colorCheck}
                            >
                              ✓
                            </Text>
                          )}
                        </View>

                        <Text
                          numberOfLines={1}
                          style={[
                            styles.colorOptionName,
                            {
                              color: selected
                                ? theme.primary2
                                : theme.muted,
                            },
                          ]}
                        >
                          {color.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/*
                  Kullanıcının beğendiği pano önizleme alanını
                  koruyoruz.
                */}

                <Text
                  style={[
                    styles.inputLabel,
                    styles.inputLabelSpacing,
                    { color: theme.text2 },
                  ]}
                >
                  Pano Önizlemem
                </Text>

                <View
                  style={[
                    styles.boardPreview,
                    {
                      backgroundColor: projectColor,
                    },
                  ]}
                >
                  <View style={styles.boardPreviewTop}>
                    <PanovioLogo compact />

                    <Text style={styles.boardPreviewDots}>
                      ⋮
                    </Text>
                  </View>

                  <Text
                    numberOfLines={2}
                    style={styles.boardPreviewTitle}
                  >
                    {projectTitle.trim() ||
                      "Yeni Panom"}
                  </Text>

                  <Text style={styles.boardPreviewSubtitle}>
                    Panovio çalışma alanı
                  </Text>

                  <View style={styles.boardPreviewColumns}>
                    <View style={styles.boardPreviewColumn} />
                    <View style={styles.boardPreviewColumn} />
                    <View style={styles.boardPreviewColumn} />
                  </View>
                </View>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    onPress={() =>
                      setShowCreateProject(false)
                    }
                    style={[
                      styles.secondaryButton,
                      {
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.secondaryButtonText,
                        { color: theme.text2 },
                      ]}
                    >
                      Vazgeç
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleCreateProject}
                    disabled={loading}
                    style={[
                      styles.modalPrimaryButton,
                      {
                        backgroundColor: theme.primary,
                      },
                    ]}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text
                        style={styles.primaryButtonText}
                      >
                        Pano Oluştur
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/*
        ========================================================
        PANO DÜZENLEME
        ========================================================
      */}

      <Modal
        visible={showEditBoard}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setShowEditBoard(false)
        }
      >
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView
            behavior={
              Platform.OS === "ios"
                ? "padding"
                : undefined
            }
            style={styles.modalKeyboard}
          >
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.modalHeader}>
                <View>
                  <Text
                    style={[
                      styles.modalTitle,
                      { color: theme.text },
                    ]}
                  >
                    Panoyu Düzenle
                  </Text>

                  <Text
                    style={[
                      styles.modalSubtitle,
                      { color: theme.muted },
                    ]}
                  >
                    Pano adını veya rengini değiştirebilirsin.
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() =>
                    setShowEditBoard(false)
                  }
                >
                  <Text
                    style={[
                      styles.modalCloseText,
                      { color: theme.muted },
                    ]}
                  >
                    ×
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <Text
                  style={[
                    styles.inputLabel,
                    { color: theme.text2 },
                  ]}
                >
                  Pano Adı
                </Text>

                <TextInput
                  value={editBoardTitle}
                  onChangeText={setEditBoardTitle}
                  placeholder="Pano adı"
                  placeholderTextColor={theme.muted2}
                  style={[
                    styles.input,
                    {
                      color: theme.text,
                      backgroundColor: theme.surface2,
                      borderColor: theme.border,
                    },
                  ]}
                />

                <Text
                  style={[
                    styles.inputLabel,
                    styles.inputLabelSpacing,
                    { color: theme.text2 },
                  ]}
                >
                  Pano Rengi
                </Text>

                <View style={styles.colorGrid}>
                  {BOARD_COLORS.map((color) => {
                    const selected =
                      editBoardColor === color.value;

                    return (
                      <TouchableOpacity
                        key={color.value}
                        onPress={() =>
                          setEditBoardColor(color.value)
                        }
                        style={styles.colorOptionWrap}
                      >
                        <View
                          style={[
                            styles.colorOption,
                            {
                              backgroundColor: color.value,
                            },
                            selected &&
                              styles.colorOptionSelected,
                          ]}
                        >
                          {selected && (
                            <Text style={styles.colorCheck}>
                              ✓
                            </Text>
                          )}
                        </View>

                        <Text
                          numberOfLines={1}
                          style={[
                            styles.colorOptionName,
                            {
                              color: selected
                                ? theme.primary2
                                : theme.muted,
                            },
                          ]}
                        >
                          {color.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text
                  style={[
                    styles.inputLabel,
                    styles.inputLabelSpacing,
                    { color: theme.text2 },
                  ]}
                >
                  Pano Önizlemem
                </Text>

                <View
                  style={[
                    styles.boardPreview,
                    {
                      backgroundColor: editBoardColor,
                    },
                  ]}
                >
                  <Text style={styles.boardPreviewEyebrow}>
                    PANOVIO
                  </Text>

                  <Text style={styles.boardPreviewTitle}>
                    {editBoardTitle.trim() ||
                      "Panom"}
                  </Text>

                  <View style={styles.boardPreviewColumns}>
                    <View style={styles.boardPreviewColumn} />
                    <View style={styles.boardPreviewColumn} />
                    <View style={styles.boardPreviewColumn} />
                  </View>
                </View>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    onPress={() =>
                      setShowEditBoard(false)
                    }
                    style={[
                      styles.secondaryButton,
                      {
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.secondaryButtonText,
                        { color: theme.text2 },
                      ]}
                    >
                      Vazgeç
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleUpdateBoard}
                    style={[
                      styles.modalPrimaryButton,
                      {
                        backgroundColor: theme.primary,
                      },
                    ]}
                  >
                    <Text style={styles.primaryButtonText}>
                      Kaydet
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/*
        ========================================================
        FİLTRELER
        ========================================================
      */}

      <Modal
        visible={showFilters}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setShowFilters(false)
        }
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.bottomSheet,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.sheetHandle} />

            <View style={styles.modalHeader}>
              <View>
                <Text
                  style={[
                    styles.modalTitle,
                    { color: theme.text },
                  ]}
                >
                  Görevleri Filtrele
                </Text>

                <Text
                  style={[
                    styles.modalSubtitle,
                    { color: theme.muted },
                  ]}
                >
                  Öncelik ve tarihe göre görevleri daralt.
                </Text>
              </View>

              <TouchableOpacity
                onPress={() =>
                  setShowFilters(false)
                }
              >
                <Text
                  style={[
                    styles.modalCloseText,
                    { color: theme.muted },
                  ]}
                >
                  ×
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
            >
              <Text
                style={[
                  styles.filterSectionTitle,
                  { color: theme.text2 },
                ]}
              >
                Öncelik
              </Text>

              <View style={styles.filterOptions}>
                {[
                  ["all", "Tümü"],
                  ["high", "🔴 Yüksek"],
                  ["medium", "🟠 Orta"],
                  ["low", "🟢 Düşük"],
                ].map(([value, label]) => {
                  const active =
                    priorityFilter === value;

                  return (
                    <TouchableOpacity
                      key={value}
                      onPress={() =>
                        setPriorityFilter(value)
                      }
                      style={[
                        styles.filterChip,
                        {
                          backgroundColor: active
                            ? theme.primary
                            : theme.surface2,
                          borderColor: active
                            ? theme.primary
                            : theme.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          {
                            color: active
                              ? "#FFFFFF"
                              : theme.text2,
                          },
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text
                style={[
                  styles.filterSectionTitle,
                  styles.inputLabelSpacing,
                  { color: theme.text2 },
                ]}
              >
                Bitiş Tarihi
              </Text>

              <View style={styles.filterOptions}>
                {[
                  ["all", "Tüm Tarihler"],
                  ["today", "📅 Bugün"],
                  ["week", "🗓 Bu Hafta"],
                  ["overdue", "⚠ Geciken"],
                  ["noDate", "Tarihsiz"],
                ].map(([value, label]) => {
                  const active =
                    dateFilter === value;

                  return (
                    <TouchableOpacity
                      key={value}
                      onPress={() =>
                        setDateFilter(value)
                      }
                      style={[
                        styles.filterChip,
                        {
                          backgroundColor: active
                            ? theme.primary
                            : theme.surface2,
                          borderColor: active
                            ? theme.primary
                            : theme.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          {
                            color: active
                              ? "#FFFFFF"
                              : theme.text2,
                          },
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                onPress={() =>
                  setOnlyMine((current) => !current)
                }
                style={[
                  styles.mineFilterCard,
                  {
                    backgroundColor: onlyMine
                      ? theme.surface3
                      : theme.surface2,
                    borderColor: onlyMine
                      ? theme.primary
                      : theme.border,
                  },
                ]}
              >
                <View>
                  <Text
                    style={[
                      styles.mineFilterTitle,
                      { color: theme.text },
                    ]}
                  >
                    Bana Ait Görevler
                  </Text>

                  <Text
                    style={[
                      styles.mineFilterDescription,
                      { color: theme.muted },
                    ]}
                  >
                    Yalnızca sana atanmış görevleri göster.
                  </Text>
                </View>

                <View
                  style={[
                    styles.checkbox,
                    {
                      backgroundColor: onlyMine
                        ? theme.primary
                        : "transparent",
                      borderColor: onlyMine
                        ? theme.primary
                        : theme.border,
                    },
                  ]}
                >
                  {onlyMine && (
                    <Text style={styles.checkboxText}>
                      ✓
                    </Text>
                  )}
                </View>
              </TouchableOpacity>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  onPress={clearFilters}
                  style={[
                    styles.secondaryButton,
                    {
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.secondaryButtonText,
                      { color: theme.text2 },
                    ]}
                  >
                    Temizle
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() =>
                    setShowFilters(false)
                  }
                  style={[
                    styles.modalPrimaryButton,
                    {
                      backgroundColor: theme.primary,
                    },
                  ]}
                >
                  <Text style={styles.primaryButtonText}>
                    Uygula
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/*
        ========================================================
        YENİ LİSTE
        ========================================================
      */}

      <Modal
        visible={showCreateColumn}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setShowCreateColumn(false)
        }
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.smallModalCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text
                  style={[
                    styles.modalTitle,
                    { color: theme.text },
                  ]}
                >
                  Yeni Liste
                </Text>

                <Text
                  style={[
                    styles.modalSubtitle,
                    { color: theme.muted },
                  ]}
                >
                  Panona yeni bir iş aşaması ekle.
                </Text>
              </View>

              <TouchableOpacity
                onPress={() =>
                  setShowCreateColumn(false)
                }
              >
                <Text
                  style={[
                    styles.modalCloseText,
                    { color: theme.muted },
                  ]}
                >
                  ×
                </Text>
              </TouchableOpacity>
            </View>

            <Text
              style={[
                styles.inputLabel,
                { color: theme.text2 },
              ]}
            >
              Liste Adı
            </Text>

            <TextInput
              value={columnTitle}
              onChangeText={setColumnTitle}
              placeholder="Örn. Test Aşaması"
              placeholderTextColor={theme.muted2}
              style={[
                styles.input,
                {
                  color: theme.text,
                  backgroundColor: theme.surface2,
                  borderColor: theme.border,
                },
              ]}
            />

            <TouchableOpacity
              onPress={handleCreateColumn}
              style={[
                styles.primaryButton,
                {
                  backgroundColor: theme.primary,
                  marginTop: 18,
                },
              ]}
            >
              <Text style={styles.primaryButtonText}>
                Liste Oluştur
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/*
        ========================================================
        SÜTUN / LİSTE MENÜSÜ
        ========================================================
      */}

      <Modal
        visible={showColumnMenu}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setShowColumnMenu(false)
        }
      >
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView
            behavior={
              Platform.OS === "ios"
                ? "padding"
                : undefined
            }
            style={styles.modalKeyboard}
          >
            <View
              style={[
                styles.smallModalCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.modalHeader}>
                <View>
                  <Text
                    style={[
                      styles.modalTitle,
                      { color: theme.text },
                    ]}
                  >
                    Listeyi Düzenle
                  </Text>

                  <Text
                    style={[
                      styles.modalSubtitle,
                      { color: theme.muted },
                    ]}
                  >
                    {selectedColumn?.title}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() =>
                    setShowColumnMenu(false)
                  }
                >
                  <Text
                    style={[
                      styles.modalCloseText,
                      { color: theme.muted },
                    ]}
                  >
                    ×
                  </Text>
                </TouchableOpacity>
              </View>

              <Text
                style={[
                  styles.inputLabel,
                  { color: theme.text2 },
                ]}
              >
                Liste Adı
              </Text>

              <TextInput
                value={editColumnTitle}
                onChangeText={setEditColumnTitle}
                placeholder="Liste adı"
                placeholderTextColor={theme.muted2}
                style={[
                  styles.input,
                  {
                    color: theme.text,
                    backgroundColor: theme.surface2,
                    borderColor: theme.border,
                  },
                ]}
              />

              <TouchableOpacity
                onPress={handleRenameColumn}
                style={[
                  styles.primaryButton,
                  {
                    backgroundColor: theme.primary,
                    marginTop: 16,
                  },
                ]}
              >
                <Text style={styles.primaryButtonText}>
                  Değişiklikleri Kaydet
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDeleteColumn}
                style={[
                  styles.dangerOutlineButton,
                  {
                    borderColor: theme.danger,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dangerOutlineButtonText,
                    {
                      color: theme.danger,
                    },
                  ]}
                >
                  🗑 Listeyi Sil
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/*
        ========================================================
        YENİ GÖREV
        ========================================================

        İstenen değişiklik burada:

        Eski mobil sürümde açıklama ana alanlardan biriydi.
        Yeni tasarımda görev oluştururken öne çıkan alanlar:

        - Başlık
        - Dosya
        - Başlangıç tarihi
        - Bitiş tarihi
        - Öncelik
        - Liste
        - Sorumlu
      */}

      <Modal
        visible={showCreateTask}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setShowCreateTask(false)
        }
      >
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView
            behavior={
              Platform.OS === "ios"
                ? "padding"
                : undefined
            }
            style={styles.modalKeyboard}
          >
            <View
              style={[
                styles.largeModalCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderInfo}>
                  <Text
                    style={[
                      styles.modalTitle,
                      { color: theme.text },
                    ]}
                  >
                    Yeni Görev
                  </Text>

                  <Text
                    style={[
                      styles.modalSubtitle,
                      { color: theme.muted },
                    ]}
                  >
                    Görev bilgilerini belirleyip panoya ekle.
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() =>
                    setShowCreateTask(false)
                  }
                >
                  <Text
                    style={[
                      styles.modalCloseText,
                      { color: theme.muted },
                    ]}
                  >
                    ×
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={
                  styles.taskFormContent
                }
              >
                <Text
                  style={[
                    styles.inputLabel,
                    { color: theme.text2 },
                  ]}
                >
                  Görev Başlığı *
                </Text>

                <TextInput
                  value={taskTitle}
                  onChangeText={setTaskTitle}
                  placeholder="Görev başlığını yaz..."
                  placeholderTextColor={theme.muted2}
                  maxLength={150}
                  style={[
                    styles.input,
                    {
                      color: theme.text,
                      backgroundColor: theme.surface2,
                      borderColor: theme.border,
                    },
                  ]}
                />

                {/* Açıklama + dosya ekleme: web sürümündeki gibi aynı alan içinde */}
                <Text
                  style={[
                    styles.inputLabel,
                    styles.inputLabelSpacing,
                    { color: theme.text2 },
                  ]}
                >
                  Açıklama
                </Text>

                <View
                  style={[
                    styles.descriptionAttachmentBox,
                    {
                      backgroundColor: theme.surface2,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <TextInput
                    value={taskDescription}
                    onChangeText={setTaskDescription}
                    placeholder="Görev açıklamasını yaz..."
                    placeholderTextColor={theme.muted2}
                    multiline
                    textAlignVertical="top"
                    style={[styles.descriptionAttachmentInput, { color: theme.text }]}
                  />

                  {!!pendingAttachments.length && (
                    <View style={styles.pendingFileList}>
                      {pendingAttachments.map((file, index) => (
                        <View
                          key={`${file.uri}-${index}`}
                          style={[
                            styles.pendingFile,
                            {
                              backgroundColor: theme.surface3,
                              borderColor: theme.border,
                            },
                          ]}
                        >
                          <Text style={styles.pendingFileIcon}>📄</Text>
                          <View style={styles.pendingFileInfo}>
                            <Text numberOfLines={1} style={[styles.pendingFileName, { color: theme.text }]}>
                              {file.name || `Dosya ${index + 1}`}
                            </Text>
                            {!!file.size && (
                              <Text style={[styles.pendingFileSize, { color: theme.muted }]}>
                                {getFileSize(file.size)}
                              </Text>
                            )}
                          </View>
                          <TouchableOpacity onPress={() => removePendingAttachment(index)}>
                            <Text style={[styles.pendingFileRemove, { color: theme.danger }]}>×</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}

                  <TouchableOpacity
                    onPress={pickTaskAttachments}
                    style={[styles.inlineAttachmentButton, { borderColor: theme.border }]}
                  >
                    <Text style={[styles.inlineAttachmentIcon, { color: theme.primary2 }]}>📎</Text>
                    <Text style={[styles.inlineAttachmentText, { color: theme.primary2 }]}>Dosya Ekle</Text>
                  </TouchableOpacity>
                </View>

                {/*
                  ------------------------------------------------
                  TARİHLER
                  ------------------------------------------------
                */}

                <Text
                  style={[
                    styles.inputLabel,
                    styles.inputLabelSpacing,
                    { color: theme.text2 },
                  ]}
                >
                  Tarihler
                </Text>

                <View style={styles.twoColumnRow}>
                  <View style={styles.halfField}>
                    <Text
                      style={[
                        styles.smallFieldLabel,
                        { color: theme.muted },
                      ]}
                    >
                      Başlangıç
                    </Text>

                    <TextInput
                      value={taskStartDate}
                      onChangeText={setTaskStartDate}
                      placeholder="18.09.2026"
                      placeholderTextColor={theme.muted2}
                      keyboardType="numbers-and-punctuation"
                      style={[
                        styles.input,
                        {
                          color: theme.text,
                          backgroundColor: theme.surface2,
                          borderColor: theme.border,
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.halfField}>
                    <Text
                      style={[
                        styles.smallFieldLabel,
                        { color: theme.muted },
                      ]}
                    >
                      Bitiş
                    </Text>

                    <TextInput
                      value={taskDueDate}
                      onChangeText={setTaskDueDate}
                      placeholder="25.09.2026"
                      placeholderTextColor={theme.muted2}
                      keyboardType="numbers-and-punctuation"
                      style={[
                        styles.input,
                        {
                          color: theme.text,
                          backgroundColor: theme.surface2,
                          borderColor: theme.border,
                        },
                      ]}
                    />
                  </View>
                </View>

                <Text
                  style={[
                    styles.dateHelper,
                    { color: theme.muted },
                  ]}
                >
                  Tarihi GG.AA.YYYY şeklinde yazabilirsin.
                </Text>

                {/*
                  ------------------------------------------------
                  ÖNCELİK
                  ------------------------------------------------
                */}

                <Text
                  style={[
                    styles.inputLabel,
                    styles.inputLabelSpacing,
                    { color: theme.text2 },
                  ]}
                >
                  Öncelik
                </Text>

                <View style={styles.priorityOptions}>
                  {[
                    ["low", "Düşük", "#10B981"],
                    ["medium", "Orta", "#F59E0B"],
                    ["high", "Yüksek", "#EF4444"],
                  ].map(([value, label, color]) => {
                    const active =
                      taskPriority === value;

                    return (
                      <TouchableOpacity
                        key={value}
                        onPress={() =>
                          setTaskPriority(value)
                        }
                        style={[
                          styles.priorityOption,
                          {
                            borderColor: active
                              ? color
                              : theme.border,
                            backgroundColor: active
                              ? `${color}18`
                              : theme.surface2,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.priorityOptionDot,
                            {
                              backgroundColor: color,
                            },
                          ]}
                        />

                        <Text
                          style={[
                            styles.priorityOptionText,
                            {
                              color: active
                                ? color
                                : theme.text2,
                            },
                          ]}
                        >
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/*
                  ------------------------------------------------
                  LİSTE
                  ------------------------------------------------
                */}

                <Text
                  style={[
                    styles.inputLabel,
                    styles.inputLabelSpacing,
                    { color: theme.text2 },
                  ]}
                >
                  Liste
                </Text>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={
                    styles.selectionChips
                  }
                >
                  {columns.map((column) => {
                    const active =
                      String(column.id) ===
                      String(taskColumnId);

                    return (
                      <TouchableOpacity
                        key={column.id}
                        onPress={() =>
                          setTaskColumnId(
                            String(column.id)
                          )
                        }
                        style={[
                          styles.selectionChip,
                          {
                            backgroundColor: active
                              ? theme.primary
                              : theme.surface2,
                            borderColor: active
                              ? theme.primary
                              : theme.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.selectionChipText,
                            {
                              color: active
                                ? "#FFFFFF"
                                : theme.text2,
                            },
                          ]}
                        >
                          {column.title}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/*
                  ------------------------------------------------
                  SORUMLU
                  ------------------------------------------------
                */}

                <Text
                  style={[
                    styles.inputLabel,
                    styles.inputLabelSpacing,
                    { color: theme.text2 },
                  ]}
                >
                  Sorumlu
                </Text>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={
                    styles.memberSelection
                  }
                >
                  <TouchableOpacity
                    onPress={() =>
                      setTaskAssignedToId("")
                    }
                    style={[
                      styles.memberOption,
                      {
                        backgroundColor:
                          !taskAssignedToId
                            ? theme.surface3
                            : theme.surface2,
                        borderColor:
                          !taskAssignedToId
                            ? theme.primary
                            : theme.border,
                      },
                    ]}
                  >
                    <Avatar
                      name="Atanmamış"
                      size={34}
                      backgroundColor="#64748B"
                    />

                    <Text
                      style={[
                        styles.memberOptionText,
                        {
                          color: !taskAssignedToId
                            ? theme.primary2
                            : theme.text2,
                        },
                      ]}
                    >
                      Atanmamış
                    </Text>
                  </TouchableOpacity>

                  {members.map((member) => {
                    const memberUser =
                      getMemberUser(member);

                    if (!memberUser?.id) {
                      return null;
                    }

                    const active =
                      String(memberUser.id) ===
                      String(taskAssignedToId);

                    return (
                      <TouchableOpacity
                        key={memberUser.id}
                        onPress={() =>
                          setTaskAssignedToId(
                            String(memberUser.id)
                          )
                        }
                        style={[
                          styles.memberOption,
                          {
                            backgroundColor: active
                              ? theme.surface3
                              : theme.surface2,
                            borderColor: active
                              ? theme.primary
                              : theme.border,
                          },
                        ]}
                      >
                        <Avatar
                          name={memberUser.name}
                          size={34}
                        />

                        <Text
                          numberOfLines={1}
                          style={[
                            styles.memberOptionText,
                            {
                              color: active
                                ? theme.primary2
                                : theme.text2,
                            },
                          ]}
                        >
                          {memberUser.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <TouchableOpacity
                  onPress={handleCreateTask}
                  disabled={loading}
                  style={[
                    styles.primaryButton,
                    {
                      backgroundColor: theme.primary,
                      marginTop: 24,
                    },
                  ]}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      ＋ Görevi Oluştur
                    </Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/*
        ========================================================
        GÖREV DÜZENLE
        ========================================================
      */}

      <Modal
        visible={showEditTask}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setShowEditTask(false)
        }
      >
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView
            behavior={
              Platform.OS === "ios"
                ? "padding"
                : undefined
            }
            style={styles.modalKeyboard}
          >
            <View
              style={[
                styles.largeModalCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.modalHeader}>
                <View>
                  <Text
                    style={[
                      styles.modalTitle,
                      { color: theme.text },
                    ]}
                  >
                    Görevi Düzenle
                  </Text>

                  <Text
                    style={[
                      styles.modalSubtitle,
                      { color: theme.muted },
                    ]}
                  >
                    Görev bilgilerini güncelle.
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() =>
                    setShowEditTask(false)
                  }
                >
                  <Text
                    style={[
                      styles.modalCloseText,
                      { color: theme.muted },
                    ]}
                  >
                    ×
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <Text
                  style={[
                    styles.inputLabel,
                    { color: theme.text2 },
                  ]}
                >
                  Görev Başlığı
                </Text>

                <TextInput
                  value={taskTitle}
                  onChangeText={setTaskTitle}
                  placeholder="Görev başlığı"
                  placeholderTextColor={theme.muted2}
                  style={[
                    styles.input,
                    {
                      color: theme.text,
                      backgroundColor: theme.surface2,
                      borderColor: theme.border,
                    },
                  ]}
                />

                <Text
                  style={[
                    styles.inputLabel,
                    styles.inputLabelSpacing,
                    { color: theme.text2 },
                  ]}
                >
                  Açıklama
                </Text>

                <TextInput
                  value={taskDescription}
                  onChangeText={setTaskDescription}
                  placeholder="Görev açıklaması..."
                  placeholderTextColor={theme.muted2}
                  multiline
                  textAlignVertical="top"
                  style={[
                    styles.input,
                    styles.textArea,
                    {
                      color: theme.text,
                      backgroundColor: theme.surface2,
                      borderColor: theme.border,
                    },
                  ]}
                />

                <Text
                  style={[
                    styles.inputLabel,
                    styles.inputLabelSpacing,
                    { color: theme.text2 },
                  ]}
                >
                  Tarihler
                </Text>

                <View style={styles.twoColumnRow}>
                  <View style={styles.halfField}>
                    <TextInput
                      value={taskStartDate}
                      onChangeText={setTaskStartDate}
                      placeholder="Başlangıç"
                      placeholderTextColor={theme.muted2}
                      style={[
                        styles.input,
                        {
                          color: theme.text,
                          backgroundColor: theme.surface2,
                          borderColor: theme.border,
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.halfField}>
                    <TextInput
                      value={taskDueDate}
                      onChangeText={setTaskDueDate}
                      placeholder="Bitiş"
                      placeholderTextColor={theme.muted2}
                      style={[
                        styles.input,
                        {
                          color: theme.text,
                          backgroundColor: theme.surface2,
                          borderColor: theme.border,
                        },
                      ]}
                    />
                  </View>
                </View>

                <Text
                  style={[
                    styles.inputLabel,
                    styles.inputLabelSpacing,
                    { color: theme.text2 },
                  ]}
                >
                  Öncelik
                </Text>

                <View style={styles.priorityOptions}>
                  {[
                    ["low", "Düşük", "#10B981"],
                    ["medium", "Orta", "#F59E0B"],
                    ["high", "Yüksek", "#EF4444"],
                  ].map(([value, label, color]) => (
                    <TouchableOpacity
                      key={value}
                      onPress={() =>
                        setTaskPriority(value)
                      }
                      style={[
                        styles.priorityOption,
                        {
                          borderColor:
                            taskPriority === value
                              ? color
                              : theme.border,
                          backgroundColor:
                            taskPriority === value
                              ? `${color}18`
                              : theme.surface2,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.priorityOptionDot,
                          { backgroundColor: color },
                        ]}
                      />

                      <Text
                        style={[
                          styles.priorityOptionText,
                          {
                            color:
                              taskPriority === value
                                ? color
                                : theme.text2,
                          },
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text
                  style={[
                    styles.inputLabel,
                    styles.inputLabelSpacing,
                    { color: theme.text2 },
                  ]}
                >
                  Liste
                </Text>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={
                    styles.selectionChips
                  }
                >
                  {columns.map((column) => {
                    const active =
                      String(column.id) ===
                      String(taskColumnId);

                    return (
                      <TouchableOpacity
                        key={column.id}
                        onPress={() =>
                          setTaskColumnId(
                            String(column.id)
                          )
                        }
                        style={[
                          styles.selectionChip,
                          {
                            backgroundColor: active
                              ? theme.primary
                              : theme.surface2,
                            borderColor: active
                              ? theme.primary
                              : theme.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.selectionChipText,
                            {
                              color: active
                                ? "#FFFFFF"
                                : theme.text2,
                            },
                          ]}
                        >
                          {column.title}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <Text
                  style={[
                    styles.inputLabel,
                    styles.inputLabelSpacing,
                    { color: theme.text2 },
                  ]}
                >
                  Sorumlu
                </Text>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={
                    styles.memberSelection
                  }
                >
                  <TouchableOpacity
                    onPress={() =>
                      setTaskAssignedToId("")
                    }
                    style={[
                      styles.memberOption,
                      {
                        backgroundColor:
                          !taskAssignedToId
                            ? theme.surface3
                            : theme.surface2,
                        borderColor:
                          !taskAssignedToId
                            ? theme.primary
                            : theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.memberOptionText,
                        {
                          color: !taskAssignedToId
                            ? theme.primary2
                            : theme.text2,
                        },
                      ]}
                    >
                      Atanmamış
                    </Text>
                  </TouchableOpacity>

                  {members.map((member) => {
                    const memberUser =
                      getMemberUser(member);

                    if (!memberUser?.id) return null;

                    const active =
                      String(memberUser.id) ===
                      String(taskAssignedToId);

                    return (
                      <TouchableOpacity
                        key={memberUser.id}
                        onPress={() =>
                          setTaskAssignedToId(
                            String(memberUser.id)
                          )
                        }
                        style={[
                          styles.memberOption,
                          {
                            backgroundColor: active
                              ? theme.surface3
                              : theme.surface2,
                            borderColor: active
                              ? theme.primary
                              : theme.border,
                          },
                        ]}
                      >
                        <Avatar
                          name={memberUser.name}
                          size={32}
                        />

                        <Text
                          style={[
                            styles.memberOptionText,
                            {
                              color: active
                                ? theme.primary2
                                : theme.text2,
                            },
                          ]}
                        >
                          {memberUser.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <TouchableOpacity
                  onPress={handleUpdateTask}
                  style={[
                    styles.primaryButton,
                    {
                      backgroundColor: theme.primary,
                      marginTop: 24,
                    },
                  ]}
                >
                  <Text style={styles.primaryButtonText}>
                    Değişiklikleri Kaydet
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/*
        ========================================================
        ÜYE DAVET ET
        ========================================================
      */}

      <Modal
        visible={showInviteMember}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setShowInviteMember(false)
        }
      >
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView
            behavior={
              Platform.OS === "ios"
                ? "padding"
                : undefined
            }
            style={styles.modalKeyboard}
          >
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.modalHeader}>
                <View>
                  <Text
                    style={[
                      styles.modalTitle,
                      { color: theme.text },
                    ]}
                  >
                    Üye Davet Et
                  </Text>

                  <Text
                    style={[
                      styles.modalSubtitle,
                      { color: theme.muted },
                    ]}
                  >
                    Panovio hesabı olan bir kullanıcıyı ekibine ekle.
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() =>
                    setShowInviteMember(false)
                  }
                >
                  <Text
                    style={[
                      styles.modalCloseText,
                      { color: theme.muted },
                    ]}
                  >
                    ×
                  </Text>
                </TouchableOpacity>
              </View>

              <Text
                style={[
                  styles.inputLabel,
                  { color: theme.text2 },
                ]}
              >
                Kullanıcı E-postası
              </Text>

              <TextInput
                value={inviteEmail}
                onChangeText={setInviteEmail}
                placeholder="ekip@ornek.com"
                placeholderTextColor={theme.muted2}
                autoCapitalize="none"
                keyboardType="email-address"
                style={[
                  styles.input,
                  {
                    color: theme.text,
                    backgroundColor: theme.surface2,
                    borderColor: theme.border,
                  },
                ]}
              />

              <Text
                style={[
                  styles.inputLabel,
                  styles.inputLabelSpacing,
                  { color: theme.text2 },
                ]}
              >
                Rol
              </Text>

              <View style={styles.roleOptions}>
                {[
                  ["DEVELOPER", "Geliştirici"],
                  ["MANAGER", "Yönetici"],
                ].map(([value, label]) => {
                  const active =
                    inviteRole === value;

                  return (
                    <TouchableOpacity
                      key={value}
                      onPress={() =>
                        setInviteRole(value)
                      }
                      style={[
                        styles.roleOption,
                        {
                          backgroundColor: active
                            ? theme.surface3
                            : theme.surface2,
                          borderColor: active
                            ? theme.primary
                            : theme.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.roleOptionTitle,
                          {
                            color: active
                              ? theme.primary2
                              : theme.text,
                          },
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {!!members.length && (
                <>
                  <Text
                    style={[
                      styles.inputLabel,
                      styles.inputLabelSpacing,
                      { color: theme.text2 },
                    ]}
                  >
                    Mevcut Ekip
                  </Text>

                  <ScrollView
                    style={styles.memberListBox}
                    showsVerticalScrollIndicator={false}
                  >
                    {members.map((member) => {
                      const memberUser =
                        getMemberUser(member);

                      if (!memberUser?.id) return null;

                      return (
                        <View
                          key={memberUser.id}
                          style={[
                            styles.memberListItem,
                            {
                              borderColor: theme.borderSoft,
                            },
                          ]}
                        >
                          <Avatar
                            name={memberUser.name}
                            size={36}
                          />

                          <View
                            style={styles.memberListInfo}
                          >
                            <Text
                              style={[
                                styles.memberListName,
                                { color: theme.text },
                              ]}
                            >
                              {memberUser.name}
                            </Text>

                            <Text
                              numberOfLines={1}
                              style={[
                                styles.memberListEmail,
                                { color: theme.muted },
                              ]}
                            >
                              {memberUser.email}
                            </Text>
                          </View>

                          {isManager &&
                            Number(memberUser.id) !==
                              Number(user.id) && (
                              <TouchableOpacity
                                onPress={() =>
                                  handleRemoveMember(member)
                                }
                              >
                                <Text
                                  style={[
                                    styles.memberRemoveText,
                                    {
                                      color: theme.danger,
                                    },
                                  ]}
                                >
                                  Çıkar
                                </Text>
                              </TouchableOpacity>
                            )}
                        </View>
                      );
                    })}
                  </ScrollView>
                </>
              )}

              <TouchableOpacity
                onPress={handleInviteMember}
                style={[
                  styles.primaryButton,
                  {
                    backgroundColor: theme.primary,
                    marginTop: 20,
                  },
                ]}
              >
                <Text style={styles.primaryButtonText}>
                  ＋ Üyeyi Panoya Ekle
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/*
        ========================================================
        İSTATİSTİKLER
        ========================================================
      */}

      <Modal
        visible={showStatistics}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setShowStatistics(false)
        }
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text
                  style={[
                    styles.modalTitle,
                    { color: theme.text },
                  ]}
                >
                  Pano İstatistikleri
                </Text>

                <Text
                  style={[
                    styles.modalSubtitle,
                    { color: theme.muted },
                  ]}
                >
                  {activeProject?.title}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() =>
                  setShowStatistics(false)
                }
              >
                <Text
                  style={[
                    styles.modalCloseText,
                    { color: theme.muted },
                  ]}
                >
                  ×
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.statisticsGrid}>
                {[
                  ["Toplam Görev", statistics.total, "📋"],
                  [
                    "Tamamlanan",
                    statistics.completed,
                    "✓",
                  ],
                  [
                    "Bana Atanan",
                    statistics.mine,
                    "👤",
                  ],
                  [
                    "Geciken",
                    statistics.overdue,
                    "⚠",
                  ],
                ].map(([label, value, icon]) => (
                  <View
                    key={label}
                    style={[
                      styles.statCard,
                      {
                        backgroundColor: theme.surface2,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <Text style={styles.statCardIcon}>
                      {icon}
                    </Text>

                    <Text
                      style={[
                        styles.statCardValue,
                        { color: theme.text },
                      ]}
                    >
                      {value}
                    </Text>

                    <Text
                      style={[
                        styles.statCardLabel,
                        { color: theme.muted },
                      ]}
                    >
                      {label}
                    </Text>
                  </View>
                ))}
              </View>

              <View
                style={[
                  styles.statisticsSection,
                  {
                    backgroundColor: theme.surface2,
                    borderColor: theme.border,
                  },
                ]}
              >
                <View style={styles.progressHeader}>
                  <Text
                    style={[
                      styles.statisticsSectionTitle,
                      { color: theme.text },
                    ]}
                  >
                    Tamamlanma
                  </Text>

                  <Text
                    style={[
                      styles.progressPercent,
                      { color: theme.primary2 },
                    ]}
                  >
                    {statistics.progress}%
                  </Text>
                </View>

                <View
                  style={[
                    styles.progressTrack,
                    {
                      backgroundColor: theme.borderSoft,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${statistics.progress}%`,
                        backgroundColor: theme.primary,
                      },
                    ]}
                  />
                </View>
              </View>

              <Text
                style={[
                  styles.statisticsSectionTitle,
                  {
                    color: theme.text,
                    marginTop: 20,
                  },
                ]}
              >
                Öncelik Dağılımı
              </Text>

              {[
                [
                  "Yüksek",
                  statistics.high,
                  "#EF4444",
                ],
                [
                  "Orta",
                  statistics.medium,
                  "#F59E0B",
                ],
                [
                  "Düşük",
                  statistics.low,
                  "#10B981",
                ],
              ].map(([label, value, color]) => {
                const percent =
                  statistics.total
                    ? Math.round(
                        (value /
                          statistics.total) *
                          100
                      )
                    : 0;

                return (
                  <View
                    key={label}
                    style={styles.priorityStatRow}
                  >
                    <View
                      style={styles.priorityStatHeader}
                    >
                      <View
                        style={styles.priorityStatName}
                      >
                        <View
                          style={[
                            styles.priorityOptionDot,
                            {
                              backgroundColor: color,
                            },
                          ]}
                        />

                        <Text
                          style={[
                            styles.priorityStatLabel,
                            { color: theme.text2 },
                          ]}
                        >
                          {label}
                        </Text>
                      </View>

                      <Text
                        style={[
                          styles.priorityStatCount,
                          { color: theme.muted },
                        ]}
                      >
                        {value} görev
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.priorityStatTrack,
                        {
                          backgroundColor: theme.borderSoft,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.priorityStatFill,
                          {
                            width: `${percent}%`,
                            backgroundColor: color,
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/*
        ========================================================
        PROFİL DÜZENLE
        ========================================================
      */}

      <Modal
        visible={showEditProfile}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setShowEditProfile(false)
        }
      >
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView
            behavior={
              Platform.OS === "ios"
                ? "padding"
                : undefined
            }
            style={styles.modalKeyboard}
          >
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.modalHeader}>
                <View>
                  <Text
                    style={[
                      styles.modalTitle,
                      { color: theme.text },
                    ]}
                  >
                    Profili Düzenle
                  </Text>

                  <Text
                    style={[
                      styles.modalSubtitle,
                      { color: theme.muted },
                    ]}
                  >
                    Hesap bilgilerini güncelle.
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() =>
                    setShowEditProfile(false)
                  }
                >
                  <Text
                    style={[
                      styles.modalCloseText,
                      { color: theme.muted },
                    ]}
                  >
                    ×
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <Text
                  style={[
                    styles.inputLabel,
                    { color: theme.text2 },
                  ]}
                >
                  Ad Soyad
                </Text>

                <TextInput
                  value={profileName}
                  onChangeText={setProfileName}
                  placeholder="Ad Soyad"
                  placeholderTextColor={theme.muted2}
                  style={[
                    styles.input,
                    {
                      color: theme.text,
                      backgroundColor: theme.surface2,
                      borderColor: theme.border,
                    },
                  ]}
                />

                <Text
                  style={[
                    styles.inputLabel,
                    styles.inputLabelSpacing,
                    { color: theme.text2 },
                  ]}
                >
                  E-posta
                </Text>

                <View
                  style={[
                    styles.readOnlyField,
                    {
                      backgroundColor: theme.surface2,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.readOnlyFieldText,
                      { color: theme.muted },
                    ]}
                  >
                    {user.email}
                  </Text>
                </View>

                <View
                  style={[
                    styles.passwordSection,
                    {
                      borderColor: theme.borderSoft,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.passwordSectionTitle,
                      { color: theme.text },
                    ]}
                  >
                    Şifre Değiştir
                  </Text>

                  <Text
                    style={[
                      styles.helperText,
                      { color: theme.muted },
                    ]}
                  >
                    Şifreni değiştirmek istemiyorsan bu alanları boş bırak.
                  </Text>

                  <TextInput
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="Mevcut şifre"
                    placeholderTextColor={theme.muted2}
                    secureTextEntry
                    style={[
                      styles.input,
                      {
                        color: theme.text,
                        backgroundColor: theme.surface2,
                        borderColor: theme.border,
                        marginTop: 12,
                      },
                    ]}
                  />

                  <TextInput
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Yeni şifre"
                    placeholderTextColor={theme.muted2}
                    secureTextEntry
                    style={[
                      styles.input,
                      {
                        color: theme.text,
                        backgroundColor: theme.surface2,
                        borderColor: theme.border,
                        marginTop: 10,
                      },
                    ]}
                  />
                </View>

                <TouchableOpacity
                  onPress={handleUpdateProfile}
                  style={[
                    styles.primaryButton,
                    {
                      backgroundColor: theme.primary,
                      marginTop: 20,
                    },
                  ]}
                >
                  <Text style={styles.primaryButtonText}>
                    Profili Kaydet
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleDeleteAccount}
                  style={[
                    styles.dangerOutlineButton,
                    {
                      borderColor: theme.danger,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.dangerOutlineButtonText,
                      { color: theme.danger },
                    ]}
                  >
                    Hesabımı Sil
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/*
        ========================================================
        GÖREV DETAY MODALI
        ========================================================
      */}

      <Modal
        visible={!!selectedTask}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setSelectedTask(null)
        }
      >
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView
            behavior={
              Platform.OS === "ios"
                ? "padding"
                : undefined
            }
            style={styles.modalKeyboard}
          >
            <View
              style={[
                styles.taskDetailCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              {selectedTask && (
                <>
                  <View style={styles.modalHeader}>
                    <View style={styles.modalHeaderInfo}>
                      <Text
                        style={[
                          styles.taskDetailEyebrow,
                          {
                            color: theme.primary2,
                          },
                        ]}
                      >
                        GÖREV DETAYI
                      </Text>

                      <Text
                        style={[
                          styles.taskDetailTitle,
                          { color: theme.text },
                        ]}
                      >
                        {selectedTask.title}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() =>
                        setSelectedTask(null)
                      }
                    >
                      <Text
                        style={[
                          styles.modalCloseText,
                          { color: theme.muted },
                        ]}
                      >
                        ×
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={
                      styles.taskDetailContent
                    }
                  >
                    <View style={styles.taskDetailActions}>
                      <TouchableOpacity
                        onPress={openEditTask}
                        style={[
                          styles.taskDetailAction,
                          {
                            backgroundColor: theme.surface2,
                            borderColor: theme.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.taskDetailActionText,
                            { color: theme.text2 },
                          ]}
                        >
                          ✎ Düzenle
                        </Text>
                      </TouchableOpacity>

                      <PriorityBadge
                        priority={selectedTask.priority}
                      />
                    </View>

                    <View style={styles.taskInfoGrid}>
                      <View
                        style={[
                          styles.taskInfoCard,
                          {
                            backgroundColor: theme.surface2,
                            borderColor: theme.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.taskInfoLabel,
                            { color: theme.muted },
                          ]}
                        >
                          Sorumlu
                        </Text>

                        <Text
                          numberOfLines={1}
                          style={[
                            styles.taskInfoValue,
                            { color: theme.text },
                          ]}
                        >
                          {selectedTask.assignedTo?.name ||
                            "Atanmamış"}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.taskInfoCard,
                          {
                            backgroundColor: theme.surface2,
                            borderColor: theme.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.taskInfoLabel,
                            { color: theme.muted },
                          ]}
                        >
                          Liste
                        </Text>

                        <Text
                          numberOfLines={1}
                          style={[
                            styles.taskInfoValue,
                            { color: theme.text },
                          ]}
                        >
                          {columns.find(
                            (column) =>
                              Number(column.id) ===
                              Number(selectedTask.columnId)
                          )?.title || "-"}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.taskInfoCard,
                          {
                            backgroundColor: theme.surface2,
                            borderColor: theme.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.taskInfoLabel,
                            { color: theme.muted },
                          ]}
                        >
                          Başlangıç
                        </Text>

                        <Text
                          style={[
                            styles.taskInfoValue,
                            { color: theme.text },
                          ]}
                        >
                          {selectedTask.startDate
                            ? formatDate(
                                selectedTask.startDate
                              )
                            : "-"}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.taskInfoCard,
                          {
                            backgroundColor: theme.surface2,
                            borderColor: isOverdue(selectedTask)
                              ? theme.danger
                              : theme.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.taskInfoLabel,
                            { color: theme.muted },
                          ]}
                        >
                          Bitiş
                        </Text>

                        <Text
                          style={[
                            styles.taskInfoValue,
                            {
                              color: isOverdue(selectedTask)
                                ? theme.danger
                                : theme.text,
                            },
                          ]}
                        >
                          {selectedTask.dueDate
                            ? formatDate(
                                selectedTask.dueDate
                              )
                            : "-"}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.detailSection}>
                      <Text
                        style={[
                          styles.detailSectionTitle,
                          { color: theme.text },
                        ]}
                      >
                        Açıklama
                      </Text>

                      <Text
                        style={[
                          styles.descriptionText,
                          {
                            color: selectedTask.description
                              ? theme.text2
                              : theme.muted,
                          },
                        ]}
                      >
                        {selectedTask.description ||
                          "Bu görev için henüz açıklama eklenmedi. Düzenle butonundan açıklama ekleyebilirsin."}
                      </Text>
                    </View>

                    {/*
                      ------------------------------------------------
                      DOSYALAR
                      ------------------------------------------------
                    */}

                    <View style={styles.detailSection}>
                      <View style={styles.detailSectionHeader}>
                        <View>
                          <Text
                            style={[
                              styles.detailSectionTitle,
                              { color: theme.text },
                            ]}
                          >
                            Dosyalar
                          </Text>

                          <Text
                            style={[
                              styles.detailSectionSubtitle,
                              { color: theme.muted },
                            ]}
                          >
                            {selectedTask.attachments?.length || 0} dosya
                          </Text>
                        </View>

                        <TouchableOpacity
                          onPress={
                            addAttachmentsToExistingTask
                          }
                          style={[
                            styles.smallAddButton,
                            {
                              backgroundColor: theme.surface3,
                              borderColor: theme.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.smallAddButtonText,
                              { color: theme.primary2 },
                            ]}
                          >
                            ＋ Dosya
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {!selectedTask.attachments?.length ? (
                        <Text
                          style={[
                            styles.detailEmptyText,
                            { color: theme.muted },
                          ]}
                        >
                          Bu göreve henüz dosya eklenmedi.
                        </Text>
                      ) : (
                        selectedTask.attachments.map(
                          (attachment) => (
                            <View
                              key={attachment.id}
                              style={[
                                styles.attachmentRow,
                                {
                                  backgroundColor:
                                    theme.surface2,
                                  borderColor: theme.border,
                                },
                              ]}
                            >
                              <Text
                                style={styles.attachmentIcon}
                              >
                                📎
                              </Text>

                              <View
                                style={styles.attachmentInfo}
                              >
                                <Text
                                  numberOfLines={1}
                                  style={[
                                    styles.attachmentName,
                                    { color: theme.text },
                                  ]}
                                >
                                  {attachment.originalName}
                                </Text>

                                <Text
                                  style={[
                                    styles.attachmentMeta,
                                    { color: theme.muted },
                                  ]}
                                >
                                  {getFileSize(
                                    attachment.size
                                  )}
                                </Text>
                              </View>

                              <TouchableOpacity
                                onPress={() =>
                                  handleDeleteAttachment(
                                    attachment
                                  )
                                }
                              >
                                <Text
                                  style={[
                                    styles.attachmentDelete,
                                    {
                                      color: theme.danger,
                                    },
                                  ]}
                                >
                                  ×
                                </Text>
                              </TouchableOpacity>
                            </View>
                          )
                        )
                      )}
                    </View>

                    {/*
                      ------------------------------------------------
                      ETİKETLER
                      ------------------------------------------------
                    */}

                    <View style={styles.detailSection}>
                      <Text
                        style={[
                          styles.detailSectionTitle,
                          { color: theme.text },
                        ]}
                      >
                        Etiketler
                      </Text>

                      {!!selectedTask.labels?.length && (
                        <View style={styles.labelList}>
                          {selectedTask.labels.map(
                            (label) => (
                              <TouchableOpacity
                                key={label.id}
                                onLongPress={() =>
                                  handleDeleteLabel(label)
                                }
                                style={[
                                  styles.labelPill,
                                  {
                                    backgroundColor:
                                      label.color ||
                                      theme.primary,
                                  },
                                ]}
                              >
                                <Text style={styles.labelPillText}>
                                  {label.text ||
                                    label.name}
                                </Text>
                              </TouchableOpacity>
                            )
                          )}
                        </View>
                      )}

                      <View style={styles.inlineForm}>
                        <TextInput
                          value={labelText}
                          onChangeText={setLabelText}
                          placeholder="Yeni etiket..."
                          placeholderTextColor={theme.muted2}
                          style={[
                            styles.inlineInput,
                            {
                              color: theme.text,
                              backgroundColor: theme.surface2,
                              borderColor: theme.border,
                            },
                          ]}
                        />

                        <TouchableOpacity
                          onPress={handleAddLabel}
                          style={[
                            styles.inlineAddButton,
                            {
                              backgroundColor: theme.primary,
                            },
                          ]}
                        >
                          <Text style={styles.inlineAddButtonText}>
                            ＋
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={
                          styles.labelColorPicker
                        }
                      >
                        {LABEL_COLORS.map((color) => (
                          <TouchableOpacity
                            key={color}
                            onPress={() =>
                              setLabelColor(color)
                            }
                            style={[
                              styles.labelColorOption,
                              {
                                backgroundColor: color,
                              },
                              labelColor === color &&
                                styles.labelColorOptionSelected,
                            ]}
                          />
                        ))}
                      </ScrollView>

                      <Text
                        style={[
                          styles.longPressHint,
                          { color: theme.muted },
                        ]}
                      >
                        Etiketi silmek için etikete basılı tut.
                      </Text>
                    </View>

                    {/*
                      ------------------------------------------------
                      CHECKLIST
                      ------------------------------------------------
                    */}

                    <View style={styles.detailSection}>
                      <View style={styles.detailSectionHeader}>
                        <Text
                          style={[
                            styles.detailSectionTitle,
                            { color: theme.text },
                          ]}
                        >
                          Kontrol Listesi
                        </Text>

                        {!!selectedTask.items?.length && (
                          <Text
                            style={[
                              styles.checklistPercent,
                              { color: theme.primary2 },
                            ]}
                          >
                            {calculateChecklistProgress(
                              selectedTask.items
                            )}
                            %
                          </Text>
                        )}
                      </View>

                      {!!selectedTask.items?.length && (
                        <View
                          style={[
                            styles.checklistProgressTrack,
                            {
                              backgroundColor:
                                theme.borderSoft,
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.checklistProgressFill,
                              {
                                width: `${calculateChecklistProgress(
                                  selectedTask.items
                                )}%`,
                                backgroundColor:
                                  theme.success,
                              },
                            ]}
                          />
                        </View>
                      )}

                      {selectedTask.items?.map((item) => (
                        <View
                          key={item.id}
                          style={styles.checklistRow}
                        >
                          <TouchableOpacity
                            onPress={() =>
                              handleToggleChecklist(item)
                            }
                            style={[
                              styles.checklistBox,
                              {
                                backgroundColor:
                                  item.isCompleted
                                    ? theme.success
                                    : "transparent",
                                borderColor:
                                  item.isCompleted
                                    ? theme.success
                                    : theme.border,
                              },
                            ]}
                          >
                            {item.isCompleted && (
                              <Text
                                style={
                                  styles.checklistCheck
                                }
                              >
                                ✓
                              </Text>
                            )}
                          </TouchableOpacity>

                          <Text
                            style={[
                              styles.checklistItemText,
                              {
                                color: item.isCompleted
                                  ? theme.muted
                                  : theme.text2,
                                textDecorationLine:
                                  item.isCompleted
                                    ? "line-through"
                                    : "none",
                              },
                            ]}
                          >
                            {item.title}
                          </Text>

                          <TouchableOpacity
                            onPress={() =>
                              handleDeleteChecklist(item)
                            }
                          >
                            <Text
                              style={[
                                styles.checklistDelete,
                                { color: theme.danger },
                              ]}
                            >
                              ×
                            </Text>
                          </TouchableOpacity>
                        </View>
                      ))}

                      <View style={styles.inlineForm}>
                        <TextInput
                          value={checklistText}
                          onChangeText={setChecklistText}
                          placeholder="Yeni kontrol maddesi..."
                          placeholderTextColor={theme.muted2}
                          style={[
                            styles.inlineInput,
                            {
                              color: theme.text,
                              backgroundColor: theme.surface2,
                              borderColor: theme.border,
                            },
                          ]}
                        />

                        <TouchableOpacity
                          onPress={handleAddChecklistItem}
                          style={[
                            styles.inlineAddButton,
                            {
                              backgroundColor: theme.primary,
                            },
                          ]}
                        >
                          <Text style={styles.inlineAddButtonText}>
                            ＋
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/*
                      ------------------------------------------------
                      YORUMLAR
                      ------------------------------------------------
                    */}

                    <View style={styles.detailSection}>
                      <Text
                        style={[
                          styles.detailSectionTitle,
                          { color: theme.text },
                        ]}
                      >
                        Yorumlar
                      </Text>

                      {!selectedTask.comments?.length ? (
                        <Text
                          style={[
                            styles.detailEmptyText,
                            { color: theme.muted },
                          ]}
                        >
                          Henüz yorum yapılmadı.
                        </Text>
                      ) : (
                        selectedTask.comments.map(
                          (comment) => (
                            <View
                              key={comment.id}
                              style={[
                                styles.commentCard,
                                {
                                  backgroundColor:
                                    theme.surface2,
                                  borderColor: theme.border,
                                },
                              ]}
                            >
                              <Avatar
                                name={
                                  comment.user?.name ||
                                  "Kullanıcı"
                                }
                                size={32}
                              />

                              <View
                                style={styles.commentBody}
                              >
                                <View
                                  style={
                                    styles.commentHeader
                                  }
                                >
                                  <Text
                                    style={[
                                      styles.commentAuthor,
                                      {
                                        color: theme.text,
                                      },
                                    ]}
                                  >
                                    {comment.user?.name ||
                                      "Kullanıcı"}
                                  </Text>

                                  <TouchableOpacity
                                    onPress={() =>
                                      handleDeleteComment(
                                        comment
                                      )
                                    }
                                  >
                                    <Text
                                      style={[
                                        styles.commentDelete,
                                        {
                                          color:
                                            theme.muted,
                                        },
                                      ]}
                                    >
                                      ×
                                    </Text>
                                  </TouchableOpacity>
                                </View>

                                <Text
                                  style={[
                                    styles.commentText,
                                    {
                                      color: theme.text2,
                                    },
                                  ]}
                                >
                                  {comment.text}
                                </Text>
                              </View>
                            </View>
                          )
                        )
                      )}

                      <View style={styles.commentComposer}>
                        <TextInput
                          value={commentText}
                          onChangeText={setCommentText}
                          placeholder="Yorum yaz..."
                          placeholderTextColor={theme.muted2}
                          multiline
                          style={[
                            styles.commentInput,
                            {
                              color: theme.text,
                              backgroundColor: theme.surface2,
                              borderColor: theme.border,
                            },
                          ]}
                        />

                        <TouchableOpacity
                          onPress={handleAddComment}
                          style={[
                            styles.commentSend,
                            {
                              backgroundColor: theme.primary,
                            },
                          ]}
                        >
                          <Text
                            style={styles.commentSendText}
                          >
                            ➤
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/*
                      ------------------------------------------------
                      AKTİVİTE
                      ------------------------------------------------
                    */}

                    {!!selectedTask.activities?.length && (
                      <View style={styles.detailSection}>
                        <Text
                          style={[
                            styles.detailSectionTitle,
                            { color: theme.text },
                          ]}
                        >
                          Aktivite
                        </Text>

                        {selectedTask.activities
                          .slice(0, 10)
                          .map((activity) => (
                            <View
                              key={activity.id}
                              style={styles.activityRow}
                            >
                              <View
                                style={[
                                  styles.activityDot,
                                  {
                                    backgroundColor:
                                      theme.primary,
                                  },
                                ]}
                              />

                              <View
                                style={styles.activityBody}
                              >
                                <Text
                                  style={[
                                    styles.activityText,
                                    {
                                      color: theme.text2,
                                    },
                                  ]}
                                >
                                  {activity.description ||
                                    activity.action ||
                                    "Görev güncellendi"}
                                </Text>

                                {!!activity.createdAt && (
                                  <Text
                                    style={[
                                      styles.activityDate,
                                      {
                                        color: theme.muted,
                                      },
                                    ]}
                                  >
                                    {new Date(
                                      activity.createdAt
                                    ).toLocaleString(
                                      "tr-TR"
                                    )}
                                  </Text>
                                )}
                              </View>
                            </View>
                          ))}
                      </View>
                    )}

                    {/*
                      ------------------------------------------------
                      GÖREV TAŞIMA
                      ------------------------------------------------
                    */}

                    <View style={styles.detailSection}>
                      <Text
                        style={[styles.detailSectionTitle, { color: theme.text }]}
                      >
                        Görevi Taşı
                      </Text>

                      <Text style={[styles.detailSectionHint, { color: theme.muted }]}>
                        Görevi taşımak istediğin listeye dokun.
                      </Text>

                      <View style={styles.moveColumnGrid}>
                        {columns.map((column) => {
                          const active =
                            Number(selectedTask.columnId) === Number(column.id);

                          return (
                            <TouchableOpacity
                              key={column.id}
                              disabled={active}
                              onPress={() => moveTaskToColumn(selectedTask, column)}
                              style={[
                                styles.moveColumnButton,
                                {
                                  borderColor: active ? theme.primary : theme.border,
                                  backgroundColor: active
                                    ? `${theme.primary}22`
                                    : theme.surface2,
                                },
                              ]}
                            >
                              <Text
                                numberOfLines={1}
                                style={[
                                  styles.moveColumnButtonText,
                                  { color: active ? theme.primary2 : theme.text2 },
                                ]}
                              >
                                {active ? "✓ " : "→ "}{column.title}
                              </Text>
                              {active && (
                                <Text style={[styles.moveColumnCurrentText, { color: theme.muted }]}>
                                  Şu an burada
                                </Text>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() =>
                        handleDeleteTask(selectedTask)
                      }
                      style={[
                        styles.dangerOutlineButton,
                        {
                          borderColor: theme.danger,
                          marginBottom: 10,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.dangerOutlineButtonText,
                          { color: theme.danger },
                        ]}
                      >
                        🗑 Görevi Sil
                      </Text>
                    </TouchableOpacity>
                  </ScrollView>
                </>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
          </View>
  );
}




/*
============================================================
STYLES
============================================================
*/

const styles = StyleSheet.create({
  /*
  ----------------------------------------------------------
  GENEL
  ----------------------------------------------------------
  */

  appRoot: {
    flex: 1,
  },

  mainBody: {
    flex: 1,
  },

  fullScreenCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  centerSection: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "600",
  },

  screenContent: {
    flex: 1,
    paddingHorizontal: 16,
  },

  screenTitle: {
    fontSize: 27,
    fontWeight: "900",
    letterSpacing: -0.6,
  },

  screenSubtitle: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
  },

  sectionHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 20,
    paddingBottom: 14,
  },

  /*
  ----------------------------------------------------------
  LOGO
  ----------------------------------------------------------
  */

  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  logoMark: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#0EA5E9",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  logoMarkCompact: {
    width: 36,
    height: 36,
    borderRadius: 11,
  },

  logoMarkInner: {
    width: 23,
    height: 23,
    borderRadius: 7,
    backgroundColor: "#7C3AED",
    transform: [{ rotate: "12deg" }],
    alignItems: "center",
    justifyContent: "center",
  },

  logoMarkInnerCompact: {
    width: 20,
    height: 20,
  },

  logoMarkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },

  logoRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  logoText: {
    marginLeft: 8,
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: -0.8,
    color: "#FFFFFF",
  },

  logoTextCompact: {
    fontSize: 22,
  },

  logoAccent: {
    color: "#38BDF8",
  },

  /*
  ----------------------------------------------------------
  HEADER
  ----------------------------------------------------------
  */

  mainHeader: {
    height: 66,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  headerThemeIcon: {
    fontSize: 18,
  },

  /*
  ----------------------------------------------------------
  AUTH
  ----------------------------------------------------------
  */

  authRoot: {
    flex: 1,
  },

  authScroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 52 : 48,
    paddingBottom: 48,
  },

  authLogoArea: {
    alignItems: "center",
    marginBottom: 28,
  },

  authSubtitle: {
    textAlign: "center",
    marginTop: 14,
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 300,
  },

  authCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
  },

  authTitle: {
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: -0.5,
  },

  authDescription: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 7,
    marginBottom: 22,
  },

  authMessage: {
    backgroundColor: "#7F1D1D22",
    borderWidth: 1,
    borderColor: "#EF444455",
    borderRadius: 12,
    padding: 11,
    marginTop: 12,
  },

  authMessageText: {
    color: "#EF4444",
    fontSize: 13,
    fontWeight: "600",
  },

  authSwitchRow: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
  },

  authSwitchText: {
    fontWeight: "800",
  },

  forgotLink: { alignSelf: "flex-end", minHeight: 42, justifyContent: "center", marginTop: 2 },
  forgotLinkText: { fontSize: 13, fontWeight: "800" },
  demoSection: { marginTop: 20, gap: 10 },
  demoDivider: { height: 1, marginBottom: 3 },
  demoLabel: { textAlign: "center", fontSize: 10, fontWeight: "900", letterSpacing: 1.2, marginBottom: 2 },
  demoButton: { minHeight: 50, borderWidth: 1, borderRadius: 14, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  demoButtonText: { fontSize: 13, fontWeight: "900" },
  codeInput: { textAlign: "center", fontSize: 22, fontWeight: "900", letterSpacing: 8 },
  forgotMessage: { textAlign: "center", fontSize: 12, lineHeight: 18, marginTop: 12, fontWeight: "700" },
  forgotModalCard: { paddingTop: 22 },
  forgotModalBrand: { alignItems: "center", justifyContent: "center", marginBottom: 18, minHeight: 42 },

  /*
  ----------------------------------------------------------
  INPUT
  ----------------------------------------------------------
  */

  inputLabel: {
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 8,
  },

  inputLabelSpacing: {
    marginTop: 19,
  },

  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 14,
    fontSize: 15,
  },

  textArea: {
    minHeight: 110,
    paddingTop: 13,
    paddingBottom: 13,
  },

  helperText: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: -2,
    marginBottom: 10,
  },

  dateHelper: {
    marginTop: 8,
    fontSize: 11,
  },

  smallFieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 7,
  },

  twoColumnRow: {
    flexDirection: "row",
    gap: 10,
  },

  halfField: {
    flex: 1,
  },

  readOnlyField: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 14,
    justifyContent: "center",
  },

  readOnlyFieldText: {
    fontSize: 15,
  },

  /*
  ----------------------------------------------------------
  BUTTON
  ----------------------------------------------------------
  */

  passwordField: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },

  passwordInput: {
    flex: 1,
    minHeight: 50,
    paddingHorizontal: 16,
    fontSize: 15,
  },

  passwordEyeButton: {
    width: 52,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
  },

  passwordEyeText: {
    fontSize: 18,
  },

  authSubmitButton: {
    marginTop: 16,
  },

  backToBoardsButton: {
    alignSelf: "flex-start",
    marginTop: 12,
    marginBottom: 4,
    minHeight: 42,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  backToBoardsText: {
    fontSize: 13,
    fontWeight: "900",
  },

  detailSectionHint: {
    marginTop: -4,
    marginBottom: 12,
    fontSize: 11,
    lineHeight: 16,
  },

  moveColumnGrid: {
    gap: 9,
  },

  moveColumnButton: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 15,
    paddingVertical: 10,
    justifyContent: "center",
  },

  moveColumnButtonText: {
    fontSize: 13,
    fontWeight: "900",
  },

  moveColumnCurrentText: {
    marginTop: 3,
    fontSize: 9,
    fontWeight: "700",
  },

  primaryButton: {
    minHeight: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 14,
  },

  secondaryButton: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "800",
  },

  modalPrimaryButton: {
    minHeight: 46,
    borderRadius: 13,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  disabledButton: {
    opacity: 0.42,
  },

  dangerOutlineButton: {
    minHeight: 48,
    marginTop: 14,
    borderWidth: 1,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },

  dangerOutlineButtonText: {
    fontWeight: "800",
    fontSize: 14,
  },

  iconSquareButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  iconSquareText: {
    fontSize: 20,
    fontWeight: "800",
  },

  /*
  ----------------------------------------------------------
  BOARD SCREEN
  ----------------------------------------------------------
  */

  boardScreen: {
    flex: 1,
  },

  boardScreenContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 120,
  },

  welcomeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 14,
  },

  welcomeInfo: {
    flex: 1,
  },

  welcomeTitle: {
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.5,
  },

  welcomeSubtitle: {
    marginTop: 4,
    fontSize: 13,
  },

  newBoardButton: {
    minHeight: 42,
    paddingHorizontal: 15,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  newBoardButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  /*
  ----------------------------------------------------------
  PROJECT TABS
  ----------------------------------------------------------
  */

  projectTabs: {
    paddingTop: 20,
    paddingBottom: 14,
    gap: 9,
  },

  projectTab: {
    maxWidth: 190,
    height: 42,
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
  },

  projectTabColor: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginRight: 8,
  },

  projectTabText: {
    fontSize: 13,
    fontWeight: "800",
    maxWidth: 145,
  },

  /*
  ----------------------------------------------------------
  BOARD HERO
  ----------------------------------------------------------
  */

  boardHero: {
    borderRadius: 20,
    overflow: "hidden",
    marginTop: 5,
    borderWidth: 1,
  },

  boardHeroAccent: { height: 3, width: "100%" },

  boardHeroOverlay: {
    padding: 18,
    backgroundColor: "transparent",
  },

  boardHeroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  boardHeroInfo: {
    flex: 1,
    paddingRight: 10,
  },

  boardHeroEyebrow: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
  },

  boardHeroTitle: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "900",
    marginTop: 0,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    textShadowColor: "rgba(0,0,0,0.22)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },

  boardHeroRole: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: "600",
  },

  boardHeroMenu: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#FFFFFF20",
    alignItems: "center",
    justifyContent: "center",
  },

  boardHeroMenuText: {
    color: "#FFFFFF",
    fontSize: 25,
    lineHeight: 27,
    fontWeight: "800",
  },

  boardHeroStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#64748B55",
  },

  boardHeroStatValue: {
    fontSize: 19,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  boardHeroStatLabel: {
    fontSize: 11,
    marginTop: 2,
    color: "#E2E8F0",
  },

  /*
  ----------------------------------------------------------
  PROGRESS
  ----------------------------------------------------------
  */

  progressCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
  },

  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  progressTitle: {
    fontSize: 13,
    fontWeight: "800",
  },

  progressPercent: {
    fontSize: 13,
    fontWeight: "900",
  },

  progressTrack: {
    height: 7,
    borderRadius: 10,
    marginTop: 11,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 10,
  },

  /*
  ----------------------------------------------------------
  SEARCH / TOOLBAR
  ----------------------------------------------------------
  */

  searchBox: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    marginTop: 14,
  },

  searchIcon: {
    fontSize: 22,
    marginRight: 8,
    color: "#64748B",
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    minHeight: 46,
  },

  toolbar: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },

  toolbarButton: {
    flex: 1,
    minHeight: 42,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },

  toolbarButtonText: {
    fontSize: 11,
    fontWeight: "800",
  },

  toolbarMoreButton: {
    width: 44,
    minHeight: 42,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  toolbarMoreText: {
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 26,
  },

  activeFiltersRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingHorizontal: 2,
  },

  activeFiltersText: {
    fontSize: 11,
  },

  clearFiltersText: {
    fontSize: 11,
    fontWeight: "800",
  },

  /*
  ----------------------------------------------------------
  KANBAN
  ----------------------------------------------------------
  */

  kanbanScroll: {
    gap: 14,
    paddingTop: 17,
    paddingBottom: 16,
    paddingRight: 12,
  },

  columnCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    alignSelf: "flex-start",
  },

  columnHeader: {
    position: "relative",
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 11,
    paddingHorizontal: 42,
  },

  columnTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 1,
  },

  columnHeaderInfo: {
    flex: 1,
    paddingRight: 8,
  },

  columnTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  columnTitle: {
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center",
    marginHorizontal: 7,
  },

  columnCount: {
    minWidth: 25,
    height: 25,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },

  columnCountText: {
    fontSize: 11,
    fontWeight: "900",
  },

  columnMenuButton: {
    position: "absolute",
    right: 0,
    top: 2,
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  columnMenuText: {
    fontSize: 21,
    fontWeight: "900",
    lineHeight: 23,
  },

  columnTasks: {
    maxHeight: 480,
  },

  columnTasksContent: {
    gap: 10,
    paddingBottom: 4,
  },

  emptyColumn: {
    minHeight: 100,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    borderWidth: 1,
    borderStyle: "dashed",
    padding: 15,
  },

  emptyColumnText: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },

  addCardButton: {
    minHeight: 42,
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },

  addCardButtonText: {
    fontSize: 12,
    fontWeight: "800",
  },

  addColumnCard: {
    minHeight: 170,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
  },

  addColumnIcon: {
    fontSize: 29,
    fontWeight: "500",
  },

  addColumnTitle: {
    marginTop: 9,
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center",
  },

  addColumnDescription: {
    marginTop: 5,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
  },

  /*
  ----------------------------------------------------------
  TASK CARD
  ----------------------------------------------------------
  */

  taskCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },

  taskLabelRow: {
    flexDirection: "row",
    gap: 5,
    marginBottom: 10,
  },

  taskLabelMini: {
    width: 28,
    height: 4,
    borderRadius: 999,
  },

  taskInfoRows: {
    marginTop: 11,
  },

  taskInfoRow: {
    minHeight: 38,
    borderTopWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  taskInfoRowLast: {
    paddingTop: 4,
  },

  taskInfoLabel: {
    width: 68,
    fontSize: 10,
    fontWeight: "800",
  },

  taskInfoValue: {
    flexShrink: 1,
    textAlign: "right",
    fontSize: 11,
    fontWeight: "800",
  },

  taskChecklistValue: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 8,
  },

  taskProgressTrack: {
    width: 64,
    height: 5,
    borderRadius: 999,
    overflow: "hidden",
  },

  taskProgressFill: {
    height: "100%",
    borderRadius: 999,
  },

  taskAssigneeCompact: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 7,
  },

  taskAssigneeCompactText: {
    maxWidth: 135,
    fontSize: 11,
    fontWeight: "800",
  },

  taskCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },

  taskCardTitle: {
    flex: 1,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "900",
  },

  taskCardDescription: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
  },

  taskCardLabels: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 9,
  },

  taskMiniLabel: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
  },

  taskMiniLabelText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
  },

  taskCardMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 10,
  },

  taskMetaPill: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },

  taskMetaText: {
    fontSize: 9,
    fontWeight: "700",
  },

  taskCardBottom: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  taskAssignee: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  taskAssigneeName: {
    marginLeft: 7,
    fontSize: 10,
    fontWeight: "700",
    maxWidth: 110,
  },

  taskMoveButtons: {
    flexDirection: "row",
    gap: 6,
  },

  taskMoveButton: {
    width: 31,
    height: 31,
    borderWidth: 1,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  taskMoveButtonText: {
    fontSize: 15,
    fontWeight: "900",
  },

  priorityBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },

  priorityBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },

  priorityBadgeText: {
    fontSize: 9,
    fontWeight: "900",
  },

  /*
  ----------------------------------------------------------
  BOTTOM NAV
  ----------------------------------------------------------
  */

  bottomNav: {
    minHeight: Platform.OS === "android" ? 82 : 86,
    paddingBottom: Platform.OS === "android" ? 12 : 18,
    paddingTop: 9,
    marginBottom: Platform.OS === "android" ? 42 : 0,
    borderTopWidth: 1,
    flexDirection: "row",
  },

  bottomNavItem: {
    flex: 1,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
  },

  bottomNavIcon: {
    fontSize: 20,
    fontWeight: "900",
  },

  bottomNavLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "900",
    marginTop: 4,
  },

  /*
  ----------------------------------------------------------
  MODALS
  ----------------------------------------------------------
  */

  modalBackdrop: {
    flex: 1,
    backgroundColor: "#020617B5",
    justifyContent: "flex-end",
  },

  modalKeyboard: {
    width: "100%",
    justifyContent: "flex-end",
  },

  modalCard: {
    width: "100%",
    maxHeight: "88%",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    padding: 18,
    paddingBottom: Platform.OS === "android" ? 25 : 32,
  },

  largeModalCard: {
    width: "100%",
    height: "92%",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    padding: 18,
    paddingBottom: Platform.OS === "android" ? 24 : 32,
  },

  smallModalCard: {
    width: "100%",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    borderWidth: 1,
    padding: 18,
    paddingBottom: Platform.OS === "android" ? 28 : 34,
  },

  taskDetailCard: {
    width: "100%",
    height: "94%",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    padding: 18,
    paddingBottom: Platform.OS === "android" ? 23 : 32,
  },

  bottomSheet: {
    width: "100%",
    maxHeight: "80%",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingBottom: Platform.OS === "android" ? 25 : 34,
  },

  sheetHandle: {
    width: 42,
    height: 4,
    borderRadius: 4,
    backgroundColor: "#64748B",
    alignSelf: "center",
    marginTop: 9,
    marginBottom: 15,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  modalHeaderInfo: {
    flex: 1,
    paddingRight: 14,
  },

  modalTitle: {
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: -0.3,
  },

  modalSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
    maxWidth: 300,
  },

  modalCloseText: {
    fontSize: 30,
    lineHeight: 31,
    fontWeight: "400",
  },

  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 24,
  },

  /*
  ----------------------------------------------------------
  ACTION MENU
  ----------------------------------------------------------
  */

  actionMenu: {
    marginHorizontal: 14,
    marginBottom: 15,
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
  },

  actionMenuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  actionMenuTitle: {
    fontSize: 18,
    fontWeight: "900",
  },

  actionMenuSubtitle: {
    fontSize: 11,
    marginTop: 3,
    maxWidth: 240,
  },

  actionMenuItem: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },

  actionMenuIcon: {
    width: 38,
    fontSize: 19,
  },

  actionMenuInfo: {
    flex: 1,
  },

  actionMenuItemTitle: {
    fontSize: 13,
    fontWeight: "800",
  },

  actionMenuItemDescription: {
    marginTop: 2,
    fontSize: 10,
    lineHeight: 15,
  },

  actionMenuDivider: {
    height: 1,
    marginVertical: 5,
  },

  /*
  ----------------------------------------------------------
  COLORS
  ----------------------------------------------------------
  */

  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -5,
    marginTop: 7,
  },

  colorOptionWrap: {
    width: "25%",
    paddingHorizontal: 5,
    marginBottom: 15,
    alignItems: "center",
  },

  colorOption: {
    width: "100%",
    aspectRatio: 1.3,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },

  colorOptionSelected: {
    borderColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },

  colorCheck: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "900",
    textShadowColor: "#00000050",
    textShadowRadius: 4,
  },

  colorOptionName: {
    fontSize: 9,
    fontWeight: "700",
    marginTop: 5,
    textAlign: "center",
  },

  boardPreview: {
    minHeight: 165,
    borderRadius: 18,
    padding: 15,
    overflow: "hidden",
  },

  boardPreviewTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  boardPreviewDots: {
    color: "#FFFFFF",
    fontSize: 23,
  },

  boardPreviewEyebrow: {
    color: "#DBEAFE",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  boardPreviewTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 13,
  },

  boardPreviewSubtitle: {
    color: "#E0F2FE",
    fontSize: 10,
    marginTop: 3,
  },

  boardPreviewColumns: {
    flexDirection: "row",
    gap: 7,
    marginTop: 20,
  },

  boardPreviewColumn: {
    flex: 1,
    height: 43,
    borderRadius: 8,
    backgroundColor: "#FFFFFF2A",
  },

  /*
  ----------------------------------------------------------
  FILTERS
  ----------------------------------------------------------
  */

  filterSectionTitle: {
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 10,
  },

  filterOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  filterChip: {
    minHeight: 39,
    minWidth: 82,
    borderRadius: 11,
    borderWidth: 1,
    paddingHorizontal: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  filterChipText: {
    fontSize: 11,
    fontWeight: "800",
  },

  mineFilterCard: {
    marginTop: 20,
    borderWidth: 1,
    borderRadius: 14,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  mineFilterTitle: {
    fontSize: 13,
    fontWeight: "900",
  },

  mineFilterDescription: {
    fontSize: 10,
    marginTop: 3,
    maxWidth: 240,
  },

  checkbox: {
    width: 23,
    height: 23,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  checkboxText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  /*
  ----------------------------------------------------------
  TASK FORM
  ----------------------------------------------------------
  */

  taskFormContent: {
    paddingBottom: 25,
  },

  descriptionAttachmentBox: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    minHeight: 150,
  },

  descriptionAttachmentInput: {
    minHeight: 82,
    fontSize: 13,
    lineHeight: 20,
    paddingHorizontal: 2,
    paddingTop: 2,
    paddingBottom: 10,
  },

  inlineAttachmentButton: {
    alignSelf: "flex-start",
    minHeight: 40,
    borderWidth: 1,
    borderRadius: 11,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 8,
  },

  inlineAttachmentIcon: {
    fontSize: 16,
  },

  inlineAttachmentText: {
    fontSize: 12,
    fontWeight: "900",
  },

  filePickerBox: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 15,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
  },

  filePickerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  filePickerEmoji: {
    fontSize: 20,
  },

  filePickerInfo: {
    flex: 1,
    marginLeft: 11,
  },

  filePickerTitle: {
    fontSize: 13,
    fontWeight: "900",
  },

  filePickerDescription: {
    fontSize: 9,
    lineHeight: 14,
    marginTop: 3,
  },

  filePickerArrow: {
    fontSize: 22,
    fontWeight: "800",
  },

  pendingFileList: {
    gap: 7,
    marginTop: 10,
  },

  pendingFile: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  pendingFileIcon: {
    fontSize: 17,
    marginRight: 8,
  },

  pendingFileInfo: {
    flex: 1,
  },

  pendingFileName: {
    fontSize: 11,
    fontWeight: "800",
  },

  pendingFileSize: {
    fontSize: 9,
    marginTop: 2,
  },

  pendingFileRemove: {
    fontSize: 22,
    paddingHorizontal: 7,
  },

  priorityOptions: {
    flexDirection: "row",
    gap: 8,
  },

  priorityOption: {
    flex: 1,
    minHeight: 43,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  priorityOptionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },

  priorityOptionText: {
    fontSize: 11,
    fontWeight: "900",
  },

  selectionChips: {
    gap: 8,
    paddingRight: 12,
  },

  selectionChip: {
    minHeight: 40,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  selectionChipText: {
    fontSize: 11,
    fontWeight: "800",
  },

  memberSelection: {
    gap: 8,
    paddingRight: 12,
  },

  memberOption: {
    minHeight: 48,
    maxWidth: 170,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  memberOptionText: {
    fontSize: 10,
    fontWeight: "800",
    marginLeft: 7,
    maxWidth: 110,
  },

  /*
  ----------------------------------------------------------
  MEMBER
  ----------------------------------------------------------
  */

  roleOptions: {
    flexDirection: "row",
    gap: 10,
  },

  roleOption: {
    flex: 1,
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  roleOptionTitle: {
    fontSize: 12,
    fontWeight: "900",
  },

  memberListBox: {
    maxHeight: 190,
  },

  memberListItem: {
    minHeight: 57,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  memberListInfo: {
    flex: 1,
    marginLeft: 9,
  },

  memberListName: {
    fontSize: 11,
    fontWeight: "800",
  },

  memberListEmail: {
    fontSize: 9,
    marginTop: 2,
  },

  memberRemoveText: {
    fontSize: 10,
    fontWeight: "800",
  },

  /*
  ----------------------------------------------------------
  STATISTICS
  ----------------------------------------------------------
  */

  statisticsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  statCard: {
    width: "48%",
    minHeight: 112,
    borderWidth: 1,
    borderRadius: 15,
    padding: 13,
  },

  statCardIcon: {
    fontSize: 19,
  },

  statCardValue: {
    fontSize: 25,
    fontWeight: "900",
    marginTop: 9,
  },

  statCardLabel: {
    fontSize: 10,
    marginTop: 3,
  },

  statisticsSection: {
    borderWidth: 1,
    borderRadius: 15,
    padding: 14,
    marginTop: 14,
  },

  statisticsSectionTitle: {
    fontSize: 14,
    fontWeight: "900",
  },

  priorityStatRow: {
    marginTop: 15,
  },

  priorityStatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  priorityStatName: {
    flexDirection: "row",
    alignItems: "center",
  },

  priorityStatLabel: {
    fontSize: 11,
    fontWeight: "800",
  },

  priorityStatCount: {
    fontSize: 10,
  },

  priorityStatTrack: {
    height: 6,
    borderRadius: 6,
    overflow: "hidden",
    marginTop: 7,
  },

  priorityStatFill: {
    height: "100%",
    borderRadius: 6,
  },

  /*
  ----------------------------------------------------------
  TASK DETAIL
  ----------------------------------------------------------
  */

  taskDetailContent: {
    paddingBottom: 25,
  },

  taskDetailEyebrow: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.1,
  },

  taskDetailTitle: {
    fontSize: 21,
    lineHeight: 27,
    fontWeight: "900",
    marginTop: 4,
  },

  taskDetailActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  taskDetailAction: {
    minHeight: 38,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  taskDetailActionText: {
    fontSize: 11,
    fontWeight: "800",
  },

  taskInfoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },

  taskInfoCard: {
    width: "48%",
    minHeight: 67,
    borderWidth: 1,
    borderRadius: 13,
    padding: 10,
  },

  taskInfoLabel: {
    fontSize: 9,
    fontWeight: "700",
  },

  taskInfoValue: {
    fontSize: 11,
    fontWeight: "800",
    marginTop: 5,
  },

  detailSection: {
    marginTop: 23,
  },

  detailSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  detailSectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 9,
  },

  detailSectionSubtitle: {
    fontSize: 9,
    marginTop: -6,
  },

  detailEmptyText: {
    fontSize: 11,
    lineHeight: 17,
  },

  descriptionText: {
    fontSize: 12,
    lineHeight: 19,
  },

  /*
  ----------------------------------------------------------
  ATTACHMENTS
  ----------------------------------------------------------
  */

  smallAddButton: {
    minHeight: 34,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  smallAddButtonText: {
    fontSize: 10,
    fontWeight: "900",
  },

  attachmentRow: {
    minHeight: 53,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    marginBottom: 7,
    flexDirection: "row",
    alignItems: "center",
  },

  attachmentIcon: {
    fontSize: 18,
    marginRight: 8,
  },

  attachmentInfo: {
    flex: 1,
  },

  attachmentName: {
    fontSize: 11,
    fontWeight: "800",
  },

  attachmentMeta: {
    fontSize: 9,
    marginTop: 2,
  },

  attachmentDelete: {
    fontSize: 22,
    paddingHorizontal: 7,
  },

  /*
  ----------------------------------------------------------
  LABELS
  ----------------------------------------------------------
  */

  labelList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },

  labelPill: {
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  labelPillText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
  },

  labelColorPicker: {
    gap: 8,
    marginTop: 10,
  },

  labelColorOption: {
    width: 27,
    height: 27,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "transparent",
  },

  labelColorOptionSelected: {
    borderColor: "#FFFFFF",
    transform: [{ scale: 1.12 }],
  },

  longPressHint: {
    marginTop: 8,
    fontSize: 9,
  },

  /*
  ----------------------------------------------------------
  INLINE FORM
  ----------------------------------------------------------
  */

  inlineForm: {
    flexDirection: "row",
    gap: 8,
    marginTop: 9,
  },

  inlineInput: {
    flex: 1,
    minHeight: 43,
    borderWidth: 1,
    borderRadius: 11,
    paddingHorizontal: 12,
    fontSize: 11,
  },

  inlineAddButton: {
    width: 43,
    height: 43,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  inlineAddButtonText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
  },

  /*
  ----------------------------------------------------------
  CHECKLIST
  ----------------------------------------------------------
  */

  checklistPercent: {
    fontSize: 11,
    fontWeight: "900",
  },

  checklistProgressTrack: {
    height: 5,
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: 10,
  },

  checklistProgressFill: {
    height: "100%",
  },

  checklistRow: {
    minHeight: 39,
    flexDirection: "row",
    alignItems: "center",
  },

  checklistBox: {
    width: 21,
    height: 21,
    borderWidth: 1,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },

  checklistCheck: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },

  checklistItemText: {
    flex: 1,
    fontSize: 11,
    marginLeft: 9,
  },

  checklistDelete: {
    fontSize: 19,
    paddingHorizontal: 7,
  },

  /*
  ----------------------------------------------------------
  COMMENTS
  ----------------------------------------------------------
  */

  commentCard: {
    borderWidth: 1,
    borderRadius: 13,
    padding: 10,
    flexDirection: "row",
    marginBottom: 8,
  },

  commentBody: {
    flex: 1,
    marginLeft: 9,
  },

  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  commentAuthor: {
    fontSize: 10,
    fontWeight: "900",
  },

  commentDelete: {
    fontSize: 18,
    paddingHorizontal: 5,
  },

  commentText: {
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },

  commentComposer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginTop: 10,
  },

  commentInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingTop: 11,
    paddingBottom: 11,
    fontSize: 11,
  },

  commentSend: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  commentSendText: {
    color: "#FFFFFF",
    fontSize: 16,
  },

  /*
  ----------------------------------------------------------
  ACTIVITY
  ----------------------------------------------------------
  */

  activityRow: {
    flexDirection: "row",
    marginBottom: 12,
  },

  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
    marginRight: 9,
  },

  activityBody: {
    flex: 1,
  },

  activityText: {
    fontSize: 10,
    lineHeight: 16,
  },

  activityDate: {
    fontSize: 8,
    marginTop: 3,
  },

  /*
  ----------------------------------------------------------
  TASK MOVE
  ----------------------------------------------------------
  */

  taskMoveLargeRow: {
    flexDirection: "row",
    gap: 8,
  },

  taskMoveLargeButton: {
    flex: 1,
    minHeight: 43,
    borderWidth: 1,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 7,
  },

  taskMoveLargeText: {
    fontSize: 10,
    fontWeight: "800",
  },

  /*
  ----------------------------------------------------------
  PROFILE
  ----------------------------------------------------------
  */

  profileScreenContent: {
    paddingTop: 20,
    paddingBottom: 100,
  },

  profileHero: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    marginTop: 17,
    alignItems: "center",
  },

  profileName: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: "900",
  },

  profileEmail: {
    marginTop: 3,
    fontSize: 11,
  },

  profileRoleBadge: { marginTop: 12, minHeight: 34, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  profileRoleText: { fontSize: 11, fontWeight: "900" },

  profileEditButton: {
    minHeight: 39,
    borderWidth: 1,
    borderRadius: 11,
    paddingHorizontal: 14,
    marginTop: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  profileEditButtonText: {
    fontSize: 11,
    fontWeight: "900",
  },

  profileStatsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },

  profileStatCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 15,
    padding: 14,
  },

  profileStatValue: {
    fontSize: 23,
    fontWeight: "900",
  },

  profileStatLabel: {
    marginTop: 3,
    fontSize: 10,
  },

  profileSummaryCard: { borderWidth: 1, borderRadius: 18, marginTop: 12, padding: 15 },
  profileSummaryTitle: { fontSize: 15, fontWeight: "900", marginBottom: 16, textAlign: "center" },
  profileSummaryRow: { flexDirection: "row", gap: 8 },
  profileSummaryItem: { flex: 1, alignItems: "center" },
  profileSummaryLabel: { marginTop: 5, fontSize: 10, fontWeight: "700", textAlign: "center" },
  profileSummaryValue: { fontSize: 20, fontWeight: "900", textAlign: "center" },

  profileMenuCard: {
    borderWidth: 1,
    borderRadius: 18,
    marginTop: 12,
    paddingHorizontal: 14,
  },

  profileMenuItem: {
    minHeight: 67,
    flexDirection: "row",
    alignItems: "center",
  },

  profileMenuBorder: {
    borderTopWidth: 1,
  },

  profileMenuIcon: {
    width: 38,
    fontSize: 18,
  },

  profileMenuInfo: {
    flex: 1,
  },

  profileMenuTitle: {
    fontSize: 12,
    fontWeight: "900",
  },

  profileMenuDescription: {
    fontSize: 9,
    marginTop: 3,
  },

  passwordSection: {
    marginTop: 22,
    paddingTop: 18,
    borderTopWidth: 1,
  },

  passwordSectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 6,
  },

  /*
  ----------------------------------------------------------
  MESSAGES
  ----------------------------------------------------------
  */

  messageSearchBox: { minHeight: 50, borderWidth: 1, borderRadius: 15, paddingHorizontal: 13, marginTop: 16, marginBottom: 12, flexDirection: "row", alignItems: "center" },
  messageSearchIcon: { fontSize: 22, marginRight: 9 },
  messageSearchInput: { flex: 1, fontSize: 13, paddingVertical: 0 },
  messageSearchClear: { fontSize: 24, paddingHorizontal: 5 },

  messageUserList: {
    paddingBottom: 100,
    gap: 8,
  },

  messageUserCard: {
    minHeight: 68,
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  messageUserInfo: {
    flex: 1,
    marginLeft: 10,
  },

  messageUserName: {
    fontSize: 13,
    fontWeight: "900",
  },

  messageUserEmail: {
    fontSize: 10,
    marginTop: 3,
  },

  messageArrow: {
    fontSize: 25,
    marginLeft: 7,
  },

  chatScreen: {
    flex: 1,
  },

  chatKeyboardContent: {
    flex: 1,
  },

  chatHeader: {
    minHeight: 62,
    borderBottomWidth: 1,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
  },

  chatBackButton: {
    width: 34,
    height: 40,
    justifyContent: "center",
  },

  chatBackText: {
    fontSize: 34,
    lineHeight: 35,
    fontWeight: "300",
  },

  chatHeaderInfo: {
    flex: 1,
    marginLeft: 9,
  },

  chatHeaderName: {
    fontSize: 12,
    fontWeight: "900",
  },

  chatHeaderEmail: {
    fontSize: 9,
    marginTop: 2,
  },

  chatRefreshButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },

  chatRefreshText: {
    fontSize: 20,
    fontWeight: "800",
  },

  chatMessages: {
    flex: 1,
  },

  chatMessagesContent: {
    flexGrow: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 15,
    paddingBottom: 15,
  },

  emptyChat: {
    alignItems: "center",
    paddingHorizontal: 35,
    paddingVertical: 35,
  },

  emptyChatIcon: {
    fontSize: 35,
  },

  emptyChatTitle: {
    fontSize: 17,
    fontWeight: "900",
    marginTop: 10,
  },

  emptyChatText: {
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 5,
  },

  messageBubbleRow: {
    width: "100%",
    marginBottom: 8,
  },

  messageBubbleRowMine: {
    alignItems: "flex-end",
  },

  messageBubbleRowOther: {
    alignItems: "flex-start",
  },

  messageBubble: {
    maxWidth: "82%",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },

  messageBubbleText: {
    fontSize: 12,
    lineHeight: 18,
  },

  messageTime: {
    fontSize: 8,
    marginTop: 4,
    alignSelf: "flex-end",
  },

  chatComposer: {
    minHeight: 67,
    borderTopWidth: 1,
    paddingHorizontal: 10,
    paddingTop: 9,
    paddingBottom: 9,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },

  chatInput: {
    flex: 1,
    minHeight: 45,
    maxHeight: 110,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingTop: 11,
    paddingBottom: 10,
    fontSize: 12,
  },

  sendButton: {
    width: 45,
    height: 45,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  sendButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
  },

  /*
  ----------------------------------------------------------
  EMPTY STATE
  ----------------------------------------------------------
  */

  emptyState: {
    borderWidth: 1,
    borderRadius: 19,
    padding: 25,
    marginTop: 18,
    alignItems: "center",
  },

  emptyStateIcon: {
    fontSize: 37,
  },

  emptyStateTitle: {
    marginTop: 11,
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center",
  },

  emptyStateDescription: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 18,
    textAlign: "center",
    maxWidth: 280,
  },

  emptyStateButton: {
    minHeight: 42,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginTop: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyStateButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },
});