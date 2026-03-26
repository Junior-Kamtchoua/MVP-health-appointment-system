"use client";

import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

/*TYPES*/

type Doctor = {
  id: string;
  full_name: string;
  email: string;
  specialty: string | null;
};

type Availability = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
};

type DoctorAvailabilityLite = {
  doctor_id: string;
  day_of_week: number;
};

type CalendarDate = {
  date: Date;
  dayOfWeek: number;
};

type TimeSlot = {
  time: string;
  isBooked: boolean;
};

type PatientForm = {
  fullName: string;
  email: string;
  phone: string;
  notes: string;
};

type FormErrors = {
  fullName?: string;
  email?: string;
  phone?: string;
};

type ToastItem = {
  id: number;
  type: "success" | "error" | "info";
  message: string;
};

type DoctorSort =
  | "name-asc"
  | "name-desc"
  | "rating-desc"
  | "price-asc"
  | "price-desc";

type InlineMessage = {
  type: "error" | "success" | "info" | null;
  text: string;
};

/*CONSTANTS*/

const STORAGE_KEY = "premium-health-booking-form-v3";
const DARK_STORAGE_KEY = "premium-health-booking-dark-v1";
const RECENT_DOCTOR_KEY = "premium-health-booking-recent-doctor-v1";
const SLOT_DURATION_MINUTES = 30;
const RESERVATION_FEE = 5;

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/*UTILS*/

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

const formatDateLabel = (date: Date) =>
  date.toLocaleDateString("en-US", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });

const formatDateLong = (date: Date) =>
  date.toLocaleDateString("en-US", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

const formatDateValue = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const uniqueSortedTimes = (times: string[]) =>
  Array.from(new Set(times)).sort((a, b) => a.localeCompare(b));

const isEmailValid = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const specialtyIcon = (specialty: string | null) => {
  const value = (specialty || "").toLowerCase();
  if (value.includes("cardio")) return "♥";
  if (value.includes("derma")) return "✦";
  if (value.includes("pedia")) return "◌";
  if (value.includes("neuro")) return "◈";
  if (value.includes("dental")) return "◆";
  if (value.includes("general")) return "✚";
  if (value.includes("ortho")) return "⬢";
  if (value.includes("gyn")) return "◎";
  return "✚";
};

const normalizePhone = (value: string) => value.replace(/[^\d+]/g, "");

const formatPhoneInput = (value: string) => {
  const raw = normalizePhone(value);
  const hasPlus = raw.startsWith("+");
  const digits = raw.replace(/\D/g, "").slice(0, 15);

  if (!digits) return "";

  const base = hasPlus ? `+${digits}` : digits;

  if (base.length <= 4) return base;
  if (base.length <= 7) return `${base.slice(0, 4)} ${base.slice(4)}`;
  if (base.length <= 10)
    return `${base.slice(0, 4)} ${base.slice(4, 7)} ${base.slice(7)}`;
  return `${base.slice(0, 4)} ${base.slice(4, 7)} ${base.slice(
    7,
    10,
  )} ${base.slice(10)}`;
};

const hashStringToNumber = (value: string) =>
  value.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);

const getDoctorMeta = (doctor: Doctor) => {
  const seed = hashStringToNumber(
    doctor.id || doctor.email || doctor.full_name,
  );
  const rating = (4.2 + (seed % 7) * 0.1).toFixed(1);
  const reviews = 24 + (seed % 170);
  const mostBooked = seed % 3 === 0;
  const initials = doctor.full_name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

  return {
    rating: Number(rating),
    reviews,
    price: RESERVATION_FEE,
    mostBooked,
    initials,
  };
};

const generateAvatarGradient = (doctor: Doctor) => {
  const seed = hashStringToNumber(
    doctor.id || doctor.email || doctor.full_name,
  );
  const variants = [
    "from-slate-700 to-slate-900",
    "from-indigo-700 to-slate-900",
    "from-zinc-700 to-neutral-900",
    "from-cyan-700 to-slate-900",
    "from-violet-700 to-slate-900",
  ];
  return variants[seed % variants.length];
};

const getMonthMatrix = (baseDate: Date) => {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const startDate = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const cellDate = new Date(startDate);
    cellDate.setDate(startDate.getDate() + index);
    return cellDate;
  });
};

const generateTimeSlots = (start: string, end: string) => {
  const slots: string[] = [];
  let [h, m] = start.split(":").map(Number);
  const [endH, endM] = end.split(":").map(Number);

  while (h < endH || (h === endH && m < endM)) {
    slots.push(
      `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`,
    );

    m += SLOT_DURATION_MINUTES;

    if (m >= 60) {
      h++;
      m = 0;
    }
  }

  return slots;
};

const getTimeGroup = (time: string) => {
  const hour = Number(time.split(":")[0]);

  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  return "Evening";
};

const starsFromRating = (rating: number) => {
  const full = Math.round(rating);
  return Array.from({ length: 5 }, (_, i) => (i < full ? "★" : "☆")).join("");
};

const inputClass = (darkMode: boolean, hasError?: boolean) =>
  cn(
    "w-full rounded-2xl border px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-4",
    darkMode ? "bg-slate-950/70 text-slate-100" : "bg-white/80 text-slate-900",
    hasError
      ? darkMode
        ? "border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/10"
        : "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
      : darkMode
        ? "border-white/10 focus:border-cyan-400 focus:ring-cyan-400/10"
        : "border-slate-200 focus:border-sky-500 focus:ring-sky-100",
  );

const getProgress = ({
  selectedDoctor,
  selectedDate,
  selectedTime,
  patient,
}: {
  selectedDoctor: Doctor | null;
  selectedDate: Date | null;
  selectedTime: string | null;
  patient: PatientForm;
}) => {
  let score = 0;
  if (selectedDoctor) score += 25;
  if (selectedDate) score += 25;
  if (selectedTime) score += 25;
  if (patient.fullName && patient.email && patient.phone) score += 25;
  return score;
};

/*SMALL UI*/

function SectionCard({
  children,
  className = "",
  darkMode,
}: {
  children: ReactNode;
  className?: string;
  darkMode: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[28px] border backdrop-blur-xl shadow-[0_24px_80px_rgba(2,6,23,0.24)]",
        darkMode
          ? "border-white/10 bg-white/[0.04]"
          : "border-white/60 bg-white/85",
        className,
      )}
    >
      {children}
    </div>
  );
}

function StatBadge({
  title,
  value,
  darkMode,
}: {
  title: string;
  value: string | number;
  darkMode: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3 shadow-sm",
        darkMode
          ? "border-white/10 bg-white/[0.04]"
          : "border-white/70 bg-white/70",
      )}
    >
      <p
        className={cn(
          "text-[11px] uppercase tracking-[0.16em]",
          darkMode ? "text-slate-400" : "text-slate-500",
        )}
      >
        {title}
      </p>
      <p
        className={cn(
          "mt-1 text-base font-semibold",
          darkMode ? "text-slate-100" : "text-slate-900",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function StepPill({
  number,
  label,
  active,
  done,
  darkMode,
}: {
  number: number;
  label: string;
  active?: boolean;
  done?: boolean;
  darkMode: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition",
          done
            ? "bg-emerald-500 text-white"
            : active
              ? "bg-cyan-500 text-slate-950"
              : darkMode
                ? "border border-white/10 bg-white/[0.05] text-slate-400"
                : "border border-slate-200 bg-white text-slate-500",
        )}
      >
        {done ? "✓" : number}
      </div>
      <span
        className={cn(
          "text-sm font-medium",
          active || done
            ? darkMode
              ? "text-slate-100"
              : "text-slate-900"
            : darkMode
              ? "text-slate-500"
              : "text-slate-500",
        )}
      >
        {label}
      </span>
    </div>
  );
}

function ToastStack({ toasts }: { toasts: ToastItem[] }) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "pointer-events-auto rounded-2xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-xl",
            toast.type === "success" &&
              "border-emerald-400/20 bg-emerald-500/12 text-emerald-100",
            toast.type === "error" &&
              "border-rose-400/20 bg-rose-500/12 text-rose-100",
            toast.type === "info" &&
              "border-cyan-400/20 bg-cyan-500/12 text-cyan-100",
          )}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}

function InlineNotice({
  message,
  darkMode,
}: {
  message: InlineMessage;
  darkMode: boolean;
}) {
  if (!message.type || !message.text) return null;

  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm",
        message.type === "error" &&
          (darkMode
            ? "border-rose-500/20 bg-rose-500/10 text-rose-100"
            : "border-rose-200 bg-rose-50 text-rose-700"),
        message.type === "success" &&
          (darkMode
            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-100"
            : "border-emerald-200 bg-emerald-50 text-emerald-700"),
        message.type === "info" &&
          (darkMode
            ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-100"
            : "border-cyan-200 bg-cyan-50 text-cyan-700"),
      )}
    >
      {message.text}
    </div>
  );
}

function LoadingDoctorSkeleton({ darkMode }: { darkMode: boolean }) {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className={cn(
            "animate-pulse rounded-[24px] border p-4",
            darkMode
              ? "border-white/10 bg-white/[0.04]"
              : "border-slate-200 bg-white",
          )}
        >
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "h-14 w-14 rounded-2xl",
                darkMode ? "bg-slate-800" : "bg-slate-200",
              )}
            />
            <div className="flex-1 space-y-3">
              <div
                className={cn(
                  "h-4 w-40 rounded-full",
                  darkMode ? "bg-slate-800" : "bg-slate-200",
                )}
              />
              <div
                className={cn(
                  "h-3 w-28 rounded-full",
                  darkMode ? "bg-slate-800/80" : "bg-slate-100",
                )}
              />
              <div className="flex gap-2">
                <div
                  className={cn(
                    "h-6 w-20 rounded-full",
                    darkMode ? "bg-slate-800/80" : "bg-slate-100",
                  )}
                />
                <div
                  className={cn(
                    "h-6 w-16 rounded-full",
                    darkMode ? "bg-slate-800/80" : "bg-slate-100",
                  )}
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function LoadingSlotSkeleton({ darkMode }: { darkMode: boolean }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-14 animate-pulse rounded-2xl",
              darkMode ? "bg-slate-900/80" : "bg-slate-200",
            )}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-11 w-24 animate-pulse rounded-2xl",
              darkMode ? "bg-slate-900/80" : "bg-slate-200",
            )}
          />
        ))}
      </div>
    </div>
  );
}

function RatingStars({
  rating,
  darkMode,
}: {
  rating: number;
  darkMode: boolean;
}) {
  return (
    <span
      className={cn(
        "text-xs tracking-wide",
        darkMode ? "text-amber-300" : "text-amber-500",
      )}
    >
      {starsFromRating(rating)}
    </span>
  );
}

/*PAGE*/

export default function UserPage() {
  const router = useRouter();

  const doctorSectionRef = useRef<HTMLDivElement | null>(null);
  const calendarSectionRef = useRef<HTMLDivElement | null>(null);
  const formSectionRef = useRef<HTMLDivElement | null>(null);

  const [darkMode, setDarkMode] = useState(true);

  const [patient, setPatient] = useState<PatientForm>({
    fullName: "",
    email: "",
    phone: "",
    notes: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [inlineMessage, setInlineMessage] = useState<InlineMessage>({
    type: null,
    text: "",
  });
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [recentDoctorId, setRecentDoctorId] = useState<string | null>(null);

  const [doctorSearch, setDoctorSearch] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const [doctorSort, setDoctorSort] = useState<DoctorSort>("rating-desc");

  const [allDoctorAvailabilities, setAllDoctorAvailabilities] = useState<
    DoctorAvailabilityLite[]
  >([]);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [calendarDates, setCalendarDates] = useState<CalendarDate[]>([]);
  const [availableTimes, setAvailableTimes] = useState<TimeSlot[]>([]);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [refreshingSlots, setRefreshingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const addToast = useCallback((type: ToastItem["type"], message: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 3200);
  }, []);

  const timezoneLabel = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return "Local time";
    }
  }, []);

  const specialties = useMemo(() => {
    const list = Array.from(
      new Set(
        doctors
          .map((doc) => (doc.specialty || "General").trim())
          .filter(Boolean),
      ),
    ).sort((a, b) => a.localeCompare(b));

    return ["all", ...list];
  }, [doctors]);

  const todayDay = useMemo(() => new Date().getDay(), []);

  const doctorAvailabilityMap = useMemo(() => {
    const map = new Map<string, number[]>();
    for (const item of allDoctorAvailabilities) {
      const existing = map.get(item.doctor_id) || [];
      if (!existing.includes(item.day_of_week)) {
        existing.push(item.day_of_week);
      }
      map.set(item.doctor_id, existing);
    }
    return map;
  }, [allDoctorAvailabilities]);

  const progress = useMemo(
    () =>
      getProgress({
        selectedDoctor,
        selectedDate,
        selectedTime,
        patient,
      }),
    [selectedDoctor, selectedDate, selectedTime, patient],
  );

  const availableCount = useMemo(
    () => availableTimes.filter((slot) => !slot.isBooked).length,
    [availableTimes],
  );

  const selectedDoctorAvailabilityCount = useMemo(
    () => availabilities.length,
    [availabilities],
  );

  const groupedTimes = useMemo(() => {
    const groups: Record<"Morning" | "Afternoon" | "Evening", TimeSlot[]> = {
      Morning: [],
      Afternoon: [],
      Evening: [],
    };

    availableTimes.forEach((slot) => {
      const group = getTimeGroup(slot.time) as keyof typeof groups;
      groups[group].push(slot);
    });

    return groups;
  }, [availableTimes]);

  const nextAvailableSlot = useMemo(() => {
    const next = availableTimes.find((slot) => !slot.isBooked);
    return next?.time || null;
  }, [availableTimes]);

  const calendarAllowedMap = useMemo(() => {
    const map = new Map<string, CalendarDate>();
    calendarDates.forEach((item) => {
      map.set(formatDateValue(item.date), item);
    });
    return map;
  }, [calendarDates]);

  const monthCells = useMemo(
    () => getMonthMatrix(calendarMonth),
    [calendarMonth],
  );

  const filteredDoctors = useMemo(() => {
    const q = doctorSearch.trim().toLowerCase();

    const base = doctors.filter((doc) => {
      const nameMatch = doc.full_name.toLowerCase().includes(q);
      const specialtyMatch = (doc.specialty || "General")
        .toLowerCase()
        .includes(q);

      const filterMatch =
        specialtyFilter === "all"
          ? true
          : (doc.specialty || "General") === specialtyFilter;

      return filterMatch && (q ? nameMatch || specialtyMatch : true);
    });

    return [...base].sort((a, b) => {
      const aMeta = getDoctorMeta(a);
      const bMeta = getDoctorMeta(b);

      switch (doctorSort) {
        case "name-asc":
          return a.full_name.localeCompare(b.full_name);
        case "name-desc":
          return b.full_name.localeCompare(a.full_name);
        case "rating-desc":
          return bMeta.rating - aMeta.rating;
        case "price-asc":
          return aMeta.price - bMeta.price;
        case "price-desc":
          return bMeta.price - aMeta.price;
        default:
          return 0;
      }
    });
  }, [doctors, doctorSearch, specialtyFilter, doctorSort]);

  const recentDoctor = useMemo(() => {
    if (!recentDoctorId) return null;
    return doctors.find((doc) => doc.id === recentDoctorId) || null;
  }, [doctors, recentDoctorId]);

  const selectedDoctorMeta = useMemo(
    () => (selectedDoctor ? getDoctorMeta(selectedDoctor) : null),
    [selectedDoctor],
  );

  const formReady =
    !!selectedDoctor &&
    !!selectedDate &&
    !!selectedTime &&
    !!patient.fullName.trim() &&
    !!patient.email.trim() &&
    !!patient.phone.trim();

  /*HELPERS*/

  const scrollToRef = (ref: React.RefObject<HTMLElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const setField = <K extends keyof PatientForm>(
    key: K,
    value: PatientForm[K],
  ) => {
    setPatient((prev) => {
      const next = { ...prev, [key]: value };
      return next;
    });
  };

  const clearInlineMessage = () => setInlineMessage({ type: null, text: "" });

  const resetSelection = () => {
    setSelectedDoctor(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setAvailabilities([]);
    setCalendarDates([]);
    setAvailableTimes([]);
    setConfirmOpen(false);
    clearInlineMessage();
    addToast("info", "Selection reset.");
    scrollToRef(doctorSectionRef);
  };

  const goBackStep = () => {
    if (selectedTime) {
      setSelectedTime(null);
      setConfirmOpen(false);
      scrollToRef(calendarSectionRef);
      return;
    }
    if (selectedDate) {
      setSelectedDate(null);
      setSelectedTime(null);
      setAvailableTimes([]);
      setConfirmOpen(false);
      scrollToRef(calendarSectionRef);
      return;
    }
    if (selectedDoctor) {
      setSelectedDoctor(null);
      setConfirmOpen(false);
      scrollToRef(doctorSectionRef);
    }
  };

  /*VALIDATION*/

  const validateField = useCallback((key: keyof PatientForm, value: string) => {
    if (key === "fullName") {
      if (!value.trim()) return "Full name is required";
      if (value.trim().length < 2) return "Enter a valid full name";
      return undefined;
    }

    if (key === "email") {
      if (!value.trim()) return "Email is required";
      if (!isEmailValid(value.trim())) return "Enter a valid email";
      return undefined;
    }

    if (key === "phone") {
      if (!value.trim()) return "Phone number is required";
      const digits = value.replace(/\D/g, "");
      if (digits.length < 8) return "Phone number is too short";
      return undefined;
    }

    return undefined;
  }, []);

  const validateForm = useCallback(() => {
    const nextErrors: FormErrors = {
      fullName: validateField("fullName", patient.fullName),
      email: validateField("email", patient.email),
      phone: validateField("phone", patient.phone),
    };

    setErrors(nextErrors);
    return !nextErrors.fullName && !nextErrors.email && !nextErrors.phone;
  }, [patient, validateField]);

  /*LOCAL STORAGE*/

  useEffect(() => {
    const savedDark = localStorage.getItem(DARK_STORAGE_KEY);
    if (savedDark) {
      setDarkMode(savedDark === "true");
    }

    const savedRecentDoctor = localStorage.getItem(RECENT_DOCTOR_KEY);
    if (savedRecentDoctor) {
      setRecentDoctorId(savedRecentDoctor);
    }

    const savedForm = localStorage.getItem(STORAGE_KEY);
    if (savedForm) {
      try {
        const parsed = JSON.parse(savedForm) as {
          patient?: PatientForm;
          selectedDoctorId?: string | null;
          selectedDate?: string | null;
          selectedTime?: string | null;
          calendarMonth?: string | null;
        };

        if (parsed.patient) {
          setPatient(parsed.patient);
        }

        if (parsed.selectedDoctorId) {
          setRecentDoctorId(parsed.selectedDoctorId);
        }

        if (parsed.calendarMonth) {
          setCalendarMonth(new Date(parsed.calendarMonth));
        }

        if (parsed.selectedDate) {
          setSelectedDate(new Date(parsed.selectedDate));
        }

        if (parsed.selectedTime) {
          setSelectedTime(parsed.selectedTime);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(DARK_STORAGE_KEY, String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        patient,
        selectedDoctorId: selectedDoctor?.id || null,
        selectedDate: selectedDate ? selectedDate.toISOString() : null,
        selectedTime,
        calendarMonth: calendarMonth.toISOString(),
      }),
    );
  }, [patient, selectedDoctor, selectedDate, selectedTime, calendarMonth]);

  useEffect(() => {
    if (selectedDoctor?.id) {
      localStorage.setItem(RECENT_DOCTOR_KEY, selectedDoctor.id);
    }
  }, [selectedDoctor]);

  /*FETCH INITIAL DATA*/

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user?.email) {
          setPatient((prev) => ({
            ...prev,
            email: prev.email || user.email || "",
            fullName:
              prev.fullName ||
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              "",
            phone: prev.phone || user.user_metadata?.phone || "",
          }));
        }

        const [
          { data: doctorsData, error: doctorsError },
          { data: allAvail, error: allAvailError },
        ] = await Promise.all([
          supabase
            .from("doctors")
            .select("id, full_name, email, specialty")
            .order("full_name", { ascending: true }),
          supabase
            .from("doctor_availabilities")
            .select("doctor_id, day_of_week"),
        ]);

        if (doctorsError) {
          console.error("Doctors fetch error:", doctorsError);
          setInlineMessage({
            type: "error",
            text: "Unable to load doctors right now.",
          });
          return;
        }

        setDoctors(doctorsData || []);
        if (!allAvailError && allAvail) {
          setAllDoctorAvailabilities(allAvail as DoctorAvailabilityLite[]);
        }
      } catch (err) {
        console.error("Unexpected doctors fetch error:", err);
        setInlineMessage({
          type: "error",
          text: "Unexpected error while loading doctors.",
        });
      } finally {
        setLoadingDoctors(false);
      }
    };

    fetchInitialData();
  }, []);

  /*KEEP SELECTED DOCTOR VALID*/

  useEffect(() => {
    if (selectedDoctor && doctors.some((doc) => doc.id === selectedDoctor.id)) {
      return;
    }

    if (recentDoctorId) {
      const found = doctors.find((doc) => doc.id === recentDoctorId);
      if (found) {
        setSelectedDoctor(found);
        return;
      }
    }

    if (filteredDoctors.length > 0) {
      setSelectedDoctor(filteredDoctors[0]);
    } else if (doctors.length > 0) {
      setSelectedDoctor(doctors[0]);
    } else {
      setSelectedDoctor(null);
    }
  }, [doctors, filteredDoctors, recentDoctorId, selectedDoctor]);

  /*FETCH AVAILABILITIES FOR SELECTED DOCTOR*/

  useEffect(() => {
    const fetchAvailabilities = async () => {
      if (!selectedDoctor) {
        setAvailabilities([]);
        setCalendarDates([]);
        setAvailableTimes([]);
        setSelectedDate(null);
        setSelectedTime(null);
        return;
      }

      setLoadingSlots(true);
      clearInlineMessage();

      try {
        const { data, error } = await supabase
          .from("doctor_availabilities")
          .select("id, day_of_week, start_time, end_time")
          .eq("doctor_id", selectedDoctor.id)
          .order("day_of_week", { ascending: true });

        if (error) {
          console.error("Availabilities fetch error:", error);
          setAvailabilities([]);
          setCalendarDates([]);
          setAvailableTimes([]);
          setSelectedDate(null);
          setSelectedTime(null);
          setInlineMessage({
            type: "error",
            text: "Could not load the doctor's availability.",
          });
          return;
        }

        const availabilityList = (data || []) as Availability[];
        setAvailabilities(availabilityList);

        const today = new Date();
        const dates: CalendarDate[] = [];

        for (let i = 0; i < 120; i++) {
          const d = new Date(today);
          d.setHours(0, 0, 0, 0);
          d.setDate(today.getDate() + i);

          const dayOfWeek = d.getDay();

          if (availabilityList.some((a) => a.day_of_week === dayOfWeek)) {
            dates.push({ date: d, dayOfWeek });
          }
        }

        setCalendarDates(dates);
        setAvailableTimes([]);
        setSelectedTime(null);

        if (selectedDate) {
          const stillAllowed = dates.find(
            (item) =>
              formatDateValue(item.date) === formatDateValue(selectedDate),
          );

          if (stillAllowed) {
            await handleSelectDate(stillAllowed, false);
          } else {
            setSelectedDate(null);
          }
        }

        setCalendarMonth((prev) => {
          if (
            prev.getFullYear() !== today.getFullYear() ||
            prev.getMonth() !== today.getMonth()
          ) {
            return today;
          }
          return prev;
        });
      } catch (err) {
        console.error("Unexpected availabilities error:", err);
        setInlineMessage({
          type: "error",
          text: "Unexpected error while loading doctor availability.",
        });
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchAvailabilities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDoctor]);

  /*AUTO SCROLL*/

  useEffect(() => {
    if (selectedDoctor) {
      const timer = window.setTimeout(() => {
        scrollToRef(calendarSectionRef);
      }, 150);

      return () => window.clearTimeout(timer);
    }
  }, [selectedDoctor]);

  useEffect(() => {
    if (selectedDate && selectedTime) {
      const timer = window.setTimeout(() => {
        scrollToRef(formSectionRef);
      }, 150);

      return () => window.clearTimeout(timer);
    }
  }, [selectedDate, selectedTime]);

  /*FORM REALTIME VALIDATION*/

  useEffect(() => {
    setErrors((prev) => ({
      ...prev,
      fullName: patient.fullName
        ? validateField("fullName", patient.fullName)
        : prev.fullName,
      email: patient.email ? validateField("email", patient.email) : prev.email,
      phone: patient.phone ? validateField("phone", patient.phone) : prev.phone,
    }));
  }, [patient.fullName, patient.email, patient.phone, validateField]);

  /*BOOKED SLOTS*/

  const loadBookedSlots = useCallback(
    async (date: Date, slots: string[]) => {
      if (!selectedDoctor) return [];

      const dateStr = formatDateValue(date);
      const dedupedSlots = uniqueSortedTimes(slots);

      const { data: booked, error } = await supabase
        .from("appointments")
        .select("appointment_time, status")
        .eq("doctor_email", selectedDoctor.email)
        .eq("appointment_date", dateStr)
        .in("status", ["pending", "paid", "accepted"]);

      if (error) {
        console.error("Booked slots fetch error:", error);

        const fallback = dedupedSlots.map((time) => ({
          time,
          isBooked: false,
        }));

        setAvailableTimes(fallback);
        return fallback;
      }

      const bookedSlots =
        booked?.map((b) => String(b.appointment_time).slice(0, 5)) || [];

      const nextSlots = dedupedSlots.map((time) => ({
        time,
        isBooked: bookedSlots.includes(time),
      }));

      setAvailableTimes(nextSlots);

      if (selectedTime && bookedSlots.includes(selectedTime)) {
        setSelectedTime(null);
        addToast(
          "error",
          "Your previously selected time is no longer available.",
        );
      }

      return nextSlots;
    },
    [addToast, selectedDoctor, selectedTime],
  );

  /*DATE SELECT*/

  const handleSelectDate = useCallback(
    async (calDate: CalendarDate, resetTime = true) => {
      if (!selectedDoctor) return;

      setSelectedDate(calDate.date);
      if (resetTime) setSelectedTime(null);
      setLoadingSlots(true);
      setConfirmOpen(false);
      clearInlineMessage();

      try {
        const rawSlots = availabilities
          .filter((a) => a.day_of_week === calDate.dayOfWeek)
          .flatMap((a) => generateTimeSlots(a.start_time, a.end_time));

        const slots = uniqueSortedTimes(rawSlots);
        await loadBookedSlots(calDate.date, slots);

        addToast("info", `Showing slots for ${formatDateLong(calDate.date)}.`);
      } catch (err) {
        console.error("Select date error:", err);
        setInlineMessage({
          type: "error",
          text: "Could not load time slots for this date.",
        });
      } finally {
        setLoadingSlots(false);
      }
    },
    [addToast, availabilities, loadBookedSlots, selectedDoctor],
  );

  const refreshCurrentSlots = async () => {
    if (!selectedDoctor || !selectedDate) return;

    setRefreshingSlots(true);
    clearInlineMessage();

    try {
      const calDate = calendarAllowedMap.get(formatDateValue(selectedDate));
      if (!calDate) return;

      const rawSlots = availabilities
        .filter((a) => a.day_of_week === calDate.dayOfWeek)
        .flatMap((a) => generateTimeSlots(a.start_time, a.end_time));

      await loadBookedSlots(selectedDate, uniqueSortedTimes(rawSlots));
      addToast("success", "Slots refreshed.");
    } catch (err) {
      console.error("Refresh slots error:", err);
      setInlineMessage({
        type: "error",
        text: "Unable to refresh time slots right now.",
      });
    } finally {
      setRefreshingSlots(false);
    }
  };

  /*ACTIONS*/

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleConfirmClick = async () => {
    clearInlineMessage();

    if (!selectedDoctor || !selectedDate || !selectedTime) {
      setInlineMessage({
        type: "error",
        text: "Please select a doctor, a date, and a time first.",
      });
      return;
    }

    if (!validateForm()) {
      setInlineMessage({
        type: "error",
        text: "Please correct the highlighted fields before continuing.",
      });
      return;
    }

    setConfirmOpen(true);
    addToast("info", "Review your appointment details before payment.");
  };

  const createAppointment = async () => {
    if (submitting) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !selectedDoctor || !selectedDate || !selectedTime) {
      setInlineMessage({
        type: "error",
        text: "Please complete all steps before confirming.",
      });
      return;
    }

    if (!validateForm()) {
      setInlineMessage({
        type: "error",
        text: "Please correct the highlighted fields before continuing.",
      });
      return;
    }

    setSubmitting(true);
    clearInlineMessage();

    try {
      const appointmentDate = formatDateValue(selectedDate);

      const currentSlots = availableTimes.map((slot) => slot.time);
      const refreshed = await loadBookedSlots(selectedDate, currentSlots);

      const latestSelected = refreshed.find(
        (slot) => slot.time === selectedTime,
      );
      if (!latestSelected || latestSelected.isBooked) {
        setInlineMessage({
          type: "error",
          text: "This slot was just taken. Please choose another one.",
        });
        addToast("error", "Selected slot is no longer available.");
        setSubmitting(false);
        return;
      }

      const { data: appointment, error } = await supabase
        .from("appointments")
        .insert({
          patient_id: user.id,
          doctor_email: selectedDoctor.email,
          appointment_date: appointmentDate,
          appointment_time: selectedTime,
          status: "pending",
          patient_name: patient.fullName.trim(),
          patient_email: patient.email.trim(),
          patient_phone: patient.phone.trim(),
          patient_notes: patient.notes.trim(),
        })
        .select()
        .single();

      if (error || !appointment) {
        console.error("Appointment create error:", error);
        setInlineMessage({
          type: "error",
          text: "This slot is already booked or the appointment could not be created.",
        });
        addToast("error", "Could not create appointment.");
        return;
      }

      const notifyResponse = await fetch("/api/appointments/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_email: patient.email.trim(),
          patient_name: patient.fullName.trim(),
          doctor_email: selectedDoctor.email,
          doctor_name: selectedDoctor.full_name,
          appointment_date: appointmentDate,
          appointment_time: selectedTime,
          status: "pending",
        }),
      });

      if (!notifyResponse.ok) {
        console.error("Notification request failed");
      }

      await loadBookedSlots(
        selectedDate,
        currentSlots.length ? currentSlots : [selectedTime],
      );

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: appointment.id }),
      });

      const stripeData = await res.json();

      if (!res.ok || !stripeData.url) {
        console.error("Stripe checkout error:", stripeData);
        setInlineMessage({
          type: "error",
          text: "Appointment created, but secure payment could not start.",
        });
        addToast("error", "Stripe checkout could not start.");
        return;
      }

      addToast("success", "Appointment created. Redirecting to payment...");
      window.location.href = stripeData.url;
    } catch (err) {
      console.error("Unexpected create appointment error:", err);
      setInlineMessage({
        type: "error",
        text: "Something went wrong. Please try again.",
      });
      addToast("error", "Unexpected error while creating appointment.");
    } finally {
      setSubmitting(false);
    }
  };

  /*UI*/

  return (
    <div
      className={cn(
        "min-h-screen px-0 py-4 sm:px-0 sm:py-6 lg:px-0",
        darkMode
          ? "bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.18),rgba(15,23,42,1)_18%,rgba(2,6,23,1)_60%,rgba(1,3,10,1)_100%)] text-slate-100"
          : "bg-[radial-gradient(circle_at_top,#dbeafe_0%,#eff6ff_25%,#f8fafc_55%,#f1f5f9_100%)] text-slate-900",
      )}
    >
      <ToastStack toasts={toasts} />

      <div className="w-full space-y-6">
        {/* HEADER */}
        <SectionCard darkMode={darkMode} className="overflow-hidden">
          <div className="relative px-4 py-6 sm:px-6 lg:px-8">
            <div
              className={cn(
                "absolute inset-0",
                darkMode
                  ? "bg-[linear-gradient(135deg,rgba(14,165,233,0.10),rgba(15,23,42,0.2),rgba(255,255,255,0.01))]"
                  : "bg-[linear-gradient(135deg,rgba(37,99,235,0.10),rgba(59,130,246,0.02),rgba(255,255,255,0.35))]",
              )}
            />

            <div className="relative space-y-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-4">
                  <div
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                      darkMode
                        ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-200"
                        : "border-sky-100 bg-sky-50 text-sky-700",
                    )}
                  >
                    <span>Premium Care Booking</span>
                  </div>

                  <div>
                    <h1
                      className={cn(
                        "text-3xl font-bold tracking-tight sm:text-4xl",
                        darkMode ? "text-white" : "text-slate-900",
                      )}
                    >
                      Book an Appointment
                    </h1>
                    <p
                      className={cn(
                        "mt-2 max-w-3xl text-sm sm:text-base",
                        darkMode ? "text-slate-300" : "text-slate-600",
                      )}
                    >
                      A darker, cleaner, more premium booking flow with calendar
                      selection, smart slot grouping, live validation, sticky
                      summary, and secure payment confirmation.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 pt-1">
                    <StepPill
                      number={1}
                      label="Doctor"
                      active={!selectedDate}
                      done={!!selectedDoctor}
                      darkMode={darkMode}
                    />
                    <div
                      className={cn(
                        "hidden h-px w-6 sm:block",
                        darkMode ? "bg-white/10" : "bg-slate-200",
                      )}
                    />
                    <StepPill
                      number={2}
                      label="Date & Time"
                      active={!!selectedDoctor && !selectedTime}
                      done={!!selectedDate && !!selectedTime}
                      darkMode={darkMode}
                    />
                    <div
                      className={cn(
                        "hidden h-px w-6 sm:block",
                        darkMode ? "bg-white/10" : "bg-slate-200",
                      )}
                    />
                    <StepPill
                      number={3}
                      label="Confirm"
                      active={!!selectedTime}
                      done={confirmOpen}
                      darkMode={darkMode}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row xl:flex-col 2xl:flex-row">
                  <StatBadge
                    title="Doctors"
                    value={doctors.length}
                    darkMode={darkMode}
                  />
                  <StatBadge
                    title="Available slots"
                    value={selectedDate ? availableCount : "—"}
                    darkMode={darkMode}
                  />
                  <StatBadge
                    title="Timezone"
                    value={timezoneLabel}
                    darkMode={darkMode}
                  />

                  <button
                    type="button"
                    onClick={() => setDarkMode((prev) => !prev)}
                    className={cn(
                      "rounded-2xl px-4 py-3 text-sm font-semibold transition hover:-translate-y-0.5",
                      darkMode
                        ? "border border-white/10 bg-white/[0.05] text-slate-100 hover:bg-white/[0.08]"
                        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                    )}
                  >
                    {darkMode ? "Light mode" : "Dark mode"}
                  </button>

                  <button
                    onClick={handleLogout}
                    className="rounded-2xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-950/20 transition hover:-translate-y-0.5 hover:bg-rose-700"
                  >
                    Logout
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div
                  className={cn(
                    "flex items-center justify-between text-xs uppercase tracking-[0.18em]",
                    darkMode ? "text-slate-400" : "text-slate-500",
                  )}
                >
                  <span>Booking progress</span>
                  <span>{progress}% complete</span>
                </div>
                <div
                  className={cn(
                    "h-2 overflow-hidden rounded-full",
                    darkMode ? "bg-white/10" : "bg-slate-200",
                  )}
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-indigo-500 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ACTION BAR */}
        <div className="flex flex-wrap gap-3 px-0">
          <button
            type="button"
            onClick={goBackStep}
            className={cn(
              "rounded-2xl px-4 py-3 text-sm font-semibold transition hover:-translate-y-0.5",
              darkMode
                ? "border border-white/10 bg-white/[0.05] text-slate-100 hover:bg-white/[0.08]"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
            )}
          >
            Back
          </button>

          <button
            type="button"
            onClick={resetSelection}
            className={cn(
              "rounded-2xl px-4 py-3 text-sm font-semibold transition hover:-translate-y-0.5",
              darkMode
                ? "border border-white/10 bg-white/[0.05] text-slate-100 hover:bg-white/[0.08]"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
            )}
          >
            Reset selection
          </button>

          {selectedDate && (
            <button
              type="button"
              onClick={refreshCurrentSlots}
              disabled={refreshingSlots}
              className={cn(
                "rounded-2xl px-4 py-3 text-sm font-semibold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60",
                darkMode
                  ? "border border-cyan-400/20 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/15"
                  : "border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100",
              )}
            >
              {refreshingSlots ? "Refreshing..." : "Reload slots"}
            </button>
          )}
        </div>

        <InlineNotice message={inlineMessage} darkMode={darkMode} />

        {/* GRID */}
        <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[1.05fr_1.2fr_0.95fr]">
          {/* DOCTORS */}
          <div ref={doctorSectionRef}>
            <SectionCard darkMode={darkMode} className="p-4 sm:p-5 lg:p-6">
              <div className="mb-5 flex flex-col gap-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2
                      className={cn(
                        "text-lg font-semibold",
                        darkMode ? "text-white" : "text-slate-900",
                      )}
                    >
                      Select a Doctor
                    </h2>
                    <p
                      className={cn(
                        "mt-1 text-sm",
                        darkMode ? "text-slate-400" : "text-slate-500",
                      )}
                    >
                      Search, filter, sort, and choose the best doctor for your
                      visit.
                    </p>
                  </div>

                  <div
                    className={cn(
                      "rounded-2xl px-3 py-2 text-xs font-semibold",
                      darkMode
                        ? "bg-cyan-500/10 text-cyan-100"
                        : "bg-sky-50 text-sky-700",
                    )}
                  >
                    {filteredDoctors.length} shown
                  </div>
                </div>

                {recentDoctor && (
                  <div
                    className={cn(
                      "rounded-[24px] border px-4 py-4",
                      darkMode
                        ? "border-white/10 bg-white/[0.03]"
                        : "border-slate-200 bg-slate-50/80",
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p
                          className={cn(
                            "text-xs font-semibold uppercase tracking-[0.18em]",
                            darkMode ? "text-slate-400" : "text-slate-500",
                          )}
                        >
                          Recently selected doctor
                        </p>
                        <p
                          className={cn(
                            "mt-2 text-sm font-semibold",
                            darkMode ? "text-slate-100" : "text-slate-900",
                          )}
                        >
                          {recentDoctor.full_name}
                        </p>
                        <p
                          className={cn(
                            "text-xs",
                            darkMode ? "text-slate-400" : "text-slate-500",
                          )}
                        >
                          {recentDoctor.specialty || "General"}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedDoctor(recentDoctor)}
                        className="rounded-2xl bg-gradient-to-r from-cyan-500 to-sky-600 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5"
                      >
                        Re-select
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="relative md:col-span-1">
                    <input
                      type="text"
                      placeholder="Search doctor or specialty..."
                      value={doctorSearch}
                      onChange={(e) => setDoctorSearch(e.target.value)}
                      className={cn(
                        "w-full rounded-2xl border pl-11 pr-4 py-3 text-sm outline-none transition",
                        darkMode
                          ? "border-white/10 bg-slate-950/70 text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10"
                          : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100",
                      )}
                    />
                    <span
                      className={cn(
                        "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2",
                        darkMode ? "text-slate-500" : "text-slate-400",
                      )}
                    >
                      ⌕
                    </span>
                  </div>

                  <select
                    value={specialtyFilter}
                    onChange={(e) => setSpecialtyFilter(e.target.value)}
                    className={cn(
                      "rounded-2xl border px-4 py-3 text-sm outline-none transition",
                      darkMode
                        ? "border-white/10 bg-slate-950/70 text-slate-100 focus:border-cyan-400"
                        : "border-slate-200 bg-white text-slate-900 focus:border-sky-500",
                    )}
                  >
                    {specialties.map((item) => (
                      <option key={item} value={item}>
                        {item === "all" ? "All specialties" : item}
                      </option>
                    ))}
                  </select>

                  <select
                    value={doctorSort}
                    onChange={(e) =>
                      setDoctorSort(e.target.value as DoctorSort)
                    }
                    className={cn(
                      "rounded-2xl border px-4 py-3 text-sm outline-none transition",
                      darkMode
                        ? "border-white/10 bg-slate-950/70 text-slate-100 focus:border-cyan-400"
                        : "border-slate-200 bg-white text-slate-900 focus:border-sky-500",
                    )}
                  >
                    <option value="rating-desc">Sort: Top rated</option>
                    <option value="price-asc">Sort: Lowest price</option>
                    <option value="price-desc">Sort: Highest price</option>
                    <option value="name-asc">Sort: Name A–Z</option>
                    <option value="name-desc">Sort: Name Z–A</option>
                  </select>
                </div>
              </div>

              {loadingDoctors && <LoadingDoctorSkeleton darkMode={darkMode} />}

              {!loadingDoctors && filteredDoctors.length === 0 && (
                <div
                  className={cn(
                    "rounded-[24px] border border-dashed px-4 py-12 text-center",
                    darkMode
                      ? "border-white/10 bg-white/[0.03]"
                      : "border-slate-200 bg-slate-50",
                  )}
                >
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-xl">
                    ⊘
                  </div>
                  <p
                    className={cn(
                      "text-sm font-medium",
                      darkMode ? "text-slate-200" : "text-slate-700",
                    )}
                  >
                    No doctors found
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-xs",
                      darkMode ? "text-slate-500" : "text-slate-500",
                    )}
                  >
                    Try another specialty, search term, or sorting method.
                  </p>
                </div>
              )}

              {!loadingDoctors && filteredDoctors.length > 0 && (
                <div className="space-y-3">
                  {filteredDoctors.map((doc) => {
                    const isSelected = selectedDoctor?.id === doc.id;
                    const meta = getDoctorMeta(doc);
                    const availableToday = (
                      doctorAvailabilityMap.get(doc.id) || []
                    ).includes(todayDay);

                    return (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => {
                          setSelectedDoctor(doc);
                          setSelectedDate(null);
                          setSelectedTime(null);
                          setConfirmOpen(false);
                          clearInlineMessage();
                        }}
                        className={cn(
                          "group w-full rounded-[24px] border p-4 text-left transition duration-300",
                          isSelected
                            ? darkMode
                              ? "border-cyan-400/30 bg-gradient-to-r from-cyan-500/10 to-slate-900/40 shadow-[0_12px_50px_rgba(6,182,212,0.14)]"
                              : "border-sky-500 bg-gradient-to-r from-sky-50 to-indigo-50 shadow-lg shadow-sky-100"
                            : darkMode
                              ? "border-white/10 bg-white/[0.03] hover:-translate-y-0.5 hover:border-cyan-400/20 hover:bg-white/[0.05]"
                              : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md",
                        )}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={cn(
                              "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-sm font-bold text-white shadow-lg",
                              generateAvatarGradient(doc),
                            )}
                          >
                            {meta.initials || specialtyIcon(doc.specialty)}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p
                                className={cn(
                                  "truncate text-base font-semibold",
                                  darkMode ? "text-white" : "text-slate-900",
                                )}
                              >
                                {doc.full_name}
                              </p>

                              {isSelected && (
                                <span className="rounded-full bg-cyan-400 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-950">
                                  Selected
                                </span>
                              )}

                              {availableToday && (
                                <span
                                  className={cn(
                                    "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
                                    darkMode
                                      ? "bg-emerald-500/15 text-emerald-200"
                                      : "bg-emerald-50 text-emerald-700",
                                  )}
                                >
                                  Available today
                                </span>
                              )}

                              {meta.mostBooked && (
                                <span
                                  className={cn(
                                    "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
                                    darkMode
                                      ? "bg-amber-500/15 text-amber-200"
                                      : "bg-amber-50 text-amber-700",
                                  )}
                                >
                                  Most booked
                                </span>
                              )}
                            </div>

                            <p
                              className={cn(
                                "mt-1 text-sm",
                                darkMode ? "text-slate-400" : "text-slate-500",
                              )}
                            >
                              {doc.specialty || "General"}
                            </p>

                            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                              <div
                                className={cn(
                                  "inline-flex items-center gap-2 rounded-full px-2.5 py-1",
                                  darkMode
                                    ? "bg-white/[0.04] text-slate-300"
                                    : "bg-slate-100 text-slate-700",
                                )}
                              >
                                <RatingStars
                                  rating={meta.rating}
                                  darkMode={darkMode}
                                />
                                <span>{meta.rating.toFixed(1)}</span>
                                <span
                                  className={cn(
                                    darkMode
                                      ? "text-slate-500"
                                      : "text-slate-500",
                                  )}
                                >
                                  ({meta.reviews})
                                </span>
                              </div>

                              <span
                                className={cn(
                                  "rounded-full px-2.5 py-1",
                                  darkMode
                                    ? "bg-white/[0.04] text-slate-300"
                                    : "bg-slate-100 text-slate-700",
                                )}
                              >
                                Reservation fee: ${RESERVATION_FEE}
                              </span>

                              <span
                                className={cn(
                                  "rounded-full px-2.5 py-1",
                                  darkMode
                                    ? "bg-white/[0.04] text-slate-300"
                                    : "bg-slate-100 text-slate-700",
                                )}
                              >
                                {SLOT_DURATION_MINUTES} min
                              </span>
                            </div>
                          </div>

                          <div
                            className={cn(
                              "pt-1 text-lg font-bold transition",
                              isSelected
                                ? darkMode
                                  ? "text-cyan-300"
                                  : "text-sky-600"
                                : darkMode
                                  ? "text-slate-600 group-hover:text-cyan-300"
                                  : "text-slate-300 group-hover:text-sky-400",
                            )}
                          >
                            {isSelected ? "✓" : "→"}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </SectionCard>
          </div>

          {/* DATE & TIME */}
          <div ref={calendarSectionRef}>
            <SectionCard darkMode={darkMode} className="p-4 sm:p-5 lg:p-6">
              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2
                    className={cn(
                      "text-lg font-semibold",
                      darkMode ? "text-white" : "text-slate-900",
                    )}
                  >
                    Choose Date & Time
                  </h2>
                  <p
                    className={cn(
                      "mt-1 text-sm",
                      darkMode ? "text-slate-400" : "text-slate-500",
                    )}
                  >
                    Real monthly calendar, grouped time slots, and automatic
                    next available suggestion.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:min-w-[240px]">
                  <StatBadge
                    title="Available days"
                    value={calendarDates.length}
                    darkMode={darkMode}
                  />
                  <StatBadge
                    title="Weekly schedules"
                    value={selectedDoctorAvailabilityCount}
                    darkMode={darkMode}
                  />
                </div>
              </div>

              {!selectedDoctor ? (
                <div
                  className={cn(
                    "rounded-[24px] border border-dashed px-4 py-14 text-center",
                    darkMode
                      ? "border-white/10 bg-white/[0.03]"
                      : "border-slate-200 bg-slate-50",
                  )}
                >
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-xl">
                    ◫
                  </div>
                  <p
                    className={cn(
                      "text-sm font-medium",
                      darkMode ? "text-slate-200" : "text-slate-700",
                    )}
                  >
                    Select a doctor first
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-xs",
                      darkMode ? "text-slate-500" : "text-slate-500",
                    )}
                  >
                    The calendar and slots will unlock automatically.
                  </p>
                </div>
              ) : loadingSlots && !selectedDate ? (
                <LoadingSlotSkeleton darkMode={darkMode} />
              ) : (
                <div className="space-y-6">
                  {calendarDates.length === 0 && (
                    <div
                      className={cn(
                        "rounded-[24px] border border-dashed px-4 py-12 text-center",
                        darkMode
                          ? "border-white/10 bg-white/[0.03]"
                          : "border-slate-200 bg-slate-50",
                      )}
                    >
                      <p
                        className={cn(
                          "text-sm font-medium",
                          darkMode ? "text-slate-200" : "text-slate-700",
                        )}
                      >
                        This doctor has no available slots yet.
                      </p>
                    </div>
                  )}

                  {calendarDates.length > 0 && (
                    <>
                      <div
                        className={cn(
                          "rounded-[24px] border p-4",
                          darkMode
                            ? "border-white/10 bg-white/[0.03]"
                            : "border-slate-200 bg-slate-50/70",
                        )}
                      >
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              setCalendarMonth(
                                (prev) =>
                                  new Date(
                                    prev.getFullYear(),
                                    prev.getMonth() - 1,
                                    1,
                                  ),
                              )
                            }
                            className={cn(
                              "rounded-2xl px-3 py-2 text-sm font-semibold transition",
                              darkMode
                                ? "bg-white/[0.05] text-slate-100 hover:bg-white/[0.08]"
                                : "bg-white text-slate-700 hover:bg-slate-100",
                            )}
                          >
                            ←
                          </button>

                          <div className="text-center">
                            <p
                              className={cn(
                                "text-sm font-semibold",
                                darkMode ? "text-white" : "text-slate-900",
                              )}
                            >
                              {MONTH_LABELS[calendarMonth.getMonth()]}{" "}
                              {calendarMonth.getFullYear()}
                            </p>
                            <p
                              className={cn(
                                "mt-1 text-xs",
                                darkMode ? "text-slate-500" : "text-slate-500",
                              )}
                            >
                              {timezoneLabel}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setCalendarMonth(
                                (prev) =>
                                  new Date(
                                    prev.getFullYear(),
                                    prev.getMonth() + 1,
                                    1,
                                  ),
                              )
                            }
                            className={cn(
                              "rounded-2xl px-3 py-2 text-sm font-semibold transition",
                              darkMode
                                ? "bg-white/[0.05] text-slate-100 hover:bg-white/[0.08]"
                                : "bg-white text-slate-700 hover:bg-slate-100",
                            )}
                          >
                            →
                          </button>
                        </div>

                        <div className="grid grid-cols-7 gap-2">
                          {WEEKDAY_LABELS.map((day) => (
                            <div
                              key={day}
                              className={cn(
                                "px-1 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.16em]",
                                darkMode ? "text-slate-500" : "text-slate-500",
                              )}
                            >
                              {day}
                            </div>
                          ))}

                          {monthCells.map((date) => {
                            const dateKey = formatDateValue(date);
                            const allowedDate = calendarAllowedMap.get(dateKey);
                            const inCurrentMonth =
                              date.getMonth() === calendarMonth.getMonth();
                            const isSelected =
                              selectedDate &&
                              formatDateValue(selectedDate) === dateKey;
                            const isToday =
                              formatDateValue(new Date()) === dateKey;

                            return (
                              <button
                                key={dateKey}
                                type="button"
                                disabled={!allowedDate}
                                onClick={() =>
                                  allowedDate && handleSelectDate(allowedDate)
                                }
                                className={cn(
                                  "min-h-[56px] rounded-2xl border px-2 py-2 text-sm transition",
                                  !allowedDate &&
                                    "cursor-not-allowed opacity-40 saturate-0",
                                  isSelected
                                    ? "border-cyan-400 bg-cyan-400 text-slate-950 shadow-[0_10px_30px_rgba(34,211,238,0.25)]"
                                    : darkMode
                                      ? "border-white/10 bg-slate-950/60 text-slate-200 hover:border-cyan-400/30 hover:bg-slate-900/80"
                                      : "border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50",
                                  !inCurrentMonth && !isSelected
                                    ? darkMode
                                      ? "text-slate-600"
                                      : "text-slate-300"
                                    : "",
                                  isToday &&
                                    !isSelected &&
                                    (darkMode
                                      ? "ring-1 ring-cyan-400/30"
                                      : "ring-1 ring-sky-300"),
                                )}
                              >
                                <div className="flex flex-col items-center justify-center gap-1">
                                  <span className="font-semibold">
                                    {date.getDate()}
                                  </span>
                                  {isToday && (
                                    <span
                                      className={cn(
                                        "text-[10px]",
                                        isSelected
                                          ? "text-slate-950/80"
                                          : darkMode
                                            ? "text-cyan-300"
                                            : "text-sky-600",
                                      )}
                                    >
                                      Today
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {selectedDate && (
                        <>
                          <div
                            className={cn(
                              "rounded-[24px] border px-4 py-4",
                              darkMode
                                ? "border-cyan-400/15 bg-cyan-500/8"
                                : "border-sky-100 bg-sky-50/70",
                            )}
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                              <div>
                                <p
                                  className={cn(
                                    "text-sm font-semibold",
                                    darkMode ? "text-cyan-100" : "text-sky-900",
                                  )}
                                >
                                  {formatDateLong(selectedDate)}
                                </p>
                                <p
                                  className={cn(
                                    "mt-1 text-xs",
                                    darkMode
                                      ? "text-cyan-200/70"
                                      : "text-sky-700",
                                  )}
                                >
                                  Booked slots are disabled. All hours shown in{" "}
                                  {timezoneLabel}.
                                </p>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <span
                                  className={cn(
                                    "rounded-full px-3 py-1 text-xs font-semibold",
                                    darkMode
                                      ? "bg-white/[0.05] text-slate-200"
                                      : "bg-white text-slate-700",
                                  )}
                                >
                                  Duration: {SLOT_DURATION_MINUTES} min
                                </span>

                                {nextAvailableSlot && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSelectedTime(nextAvailableSlot)
                                    }
                                    className="rounded-full bg-gradient-to-r from-cyan-400 to-sky-500 px-3 py-1 text-xs font-bold text-slate-950 transition hover:-translate-y-0.5"
                                  >
                                    Next available: {nextAvailableSlot}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <h3
                                  className={cn(
                                    "text-sm font-semibold",
                                    darkMode ? "text-white" : "text-slate-900",
                                  )}
                                >
                                  Select Time
                                </h3>
                                <p
                                  className={cn(
                                    "mt-1 text-xs",
                                    darkMode
                                      ? "text-slate-500"
                                      : "text-slate-500",
                                  )}
                                >
                                  Available now: {availableCount} slots
                                </p>
                              </div>
                            </div>

                            {loadingSlots ? (
                              <LoadingSlotSkeleton darkMode={darkMode} />
                            ) : availableTimes.length === 0 ? (
                              <div
                                className={cn(
                                  "rounded-[24px] border border-dashed px-4 py-10 text-center",
                                  darkMode
                                    ? "border-white/10 bg-white/[0.03]"
                                    : "border-slate-200 bg-slate-50",
                                )}
                              >
                                <p
                                  className={cn(
                                    "text-sm font-medium",
                                    darkMode
                                      ? "text-slate-200"
                                      : "text-slate-700",
                                  )}
                                >
                                  No time slots available on this date.
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-5">
                                {(
                                  [
                                    ["Morning", groupedTimes.Morning],
                                    ["Afternoon", groupedTimes.Afternoon],
                                    ["Evening", groupedTimes.Evening],
                                  ] as const
                                ).map(([label, slots]) => {
                                  if (slots.length === 0) return null;

                                  return (
                                    <div key={label} className="space-y-3">
                                      <div className="flex items-center gap-3">
                                        <div
                                          className={cn(
                                            "h-px flex-1",
                                            darkMode
                                              ? "bg-white/10"
                                              : "bg-slate-200",
                                          )}
                                        />
                                        <p
                                          className={cn(
                                            "text-[11px] font-semibold uppercase tracking-[0.18em]",
                                            darkMode
                                              ? "text-slate-400"
                                              : "text-slate-500",
                                          )}
                                        >
                                          {label}
                                        </p>
                                        <div
                                          className={cn(
                                            "h-px flex-1",
                                            darkMode
                                              ? "bg-white/10"
                                              : "bg-slate-200",
                                          )}
                                        />
                                      </div>

                                      <div className="flex flex-wrap gap-3">
                                        {slots.map(
                                          ({ time, isBooked }, index) => (
                                            <button
                                              key={`${time}-${index}`}
                                              type="button"
                                              disabled={isBooked}
                                              onClick={() =>
                                                !isBooked &&
                                                setSelectedTime(time)
                                              }
                                              className={cn(
                                                "min-w-[92px] rounded-2xl border px-4 py-3 text-sm font-semibold transition",
                                                isBooked
                                                  ? darkMode
                                                    ? "cursor-not-allowed border-white/10 bg-slate-950 text-slate-600 line-through"
                                                    : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 line-through"
                                                  : selectedTime === time
                                                    ? "border-cyan-400 bg-cyan-400 text-slate-950 shadow-[0_10px_30px_rgba(34,211,238,0.25)]"
                                                    : darkMode
                                                      ? "border-white/10 bg-white/[0.03] text-slate-100 hover:-translate-y-0.5 hover:border-cyan-400/20 hover:bg-white/[0.05]"
                                                      : "border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-sky-300 hover:bg-sky-50",
                                              )}
                                            >
                                              {time}
                                            </button>
                                          ),
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              )}
            </SectionCard>
          </div>

          {/* SUMMARY + FORM */}
          <div ref={formSectionRef} className="space-y-6">
            <SectionCard
              darkMode={darkMode}
              className="overflow-hidden sticky top-4"
            >
              <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/80 px-5 py-5 text-white">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
                  Sticky booking summary
                </p>
                <h2 className="mt-2 text-xl font-semibold">
                  Your appointment details
                </h2>
              </div>

              <div className="space-y-4 p-5">
                <div className="grid grid-cols-2 gap-3">
                  <StatBadge
                    title="Doctor"
                    value={selectedDoctor?.full_name || "Not selected"}
                    darkMode={darkMode}
                  />
                  <StatBadge
                    title="Specialty"
                    value={selectedDoctor?.specialty || "General"}
                    darkMode={darkMode}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <StatBadge
                    title="Date"
                    value={selectedDate ? formatDateLabel(selectedDate) : "—"}
                    darkMode={darkMode}
                  />
                  <StatBadge
                    title="Time"
                    value={selectedTime || "—"}
                    darkMode={darkMode}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <StatBadge
                    title="Duration"
                    value={`${SLOT_DURATION_MINUTES} min`}
                    darkMode={darkMode}
                  />
                  <StatBadge
                    title="Timezone"
                    value={timezoneLabel}
                    darkMode={darkMode}
                  />
                </div>

                {selectedDoctorMeta && (
                  <div
                    className={cn(
                      "rounded-[24px] border px-4 py-4",
                      darkMode
                        ? "border-emerald-500/15 bg-emerald-500/10"
                        : "border-emerald-100 bg-emerald-50",
                    )}
                  >
                    <p
                      className={cn(
                        "text-xs font-semibold uppercase tracking-[0.16em]",
                        darkMode ? "text-emerald-200" : "text-emerald-700",
                      )}
                    >
                      Reservation fee
                    </p>

                    <div className="mt-2 flex items-end justify-between gap-3">
                      <div>
                        <p
                          className={cn(
                            "text-2xl font-bold",
                            darkMode ? "text-emerald-100" : "text-emerald-900",
                          )}
                        >
                          ${RESERVATION_FEE.toFixed(2)}
                        </p>
                        <p
                          className={cn(
                            "mt-1 text-xs",
                            darkMode
                              ? "text-emerald-200/70"
                              : "text-emerald-700",
                          )}
                        >
                          Fixed reservation fee confirmed before Stripe
                        </p>
                      </div>

                      <div
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-semibold",
                          darkMode
                            ? "bg-white/[0.06] text-emerald-100"
                            : "bg-white text-emerald-700",
                        )}
                      >
                        Stripe
                      </div>
                    </div>
                  </div>
                )}

                {selectedDoctor && (
                  <div
                    className={cn(
                      "rounded-[24px] border px-4 py-4",
                      darkMode
                        ? "border-white/10 bg-white/[0.03]"
                        : "border-slate-200 bg-slate-50/80",
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p
                          className={cn(
                            "text-xs font-semibold uppercase tracking-[0.16em]",
                            darkMode ? "text-slate-400" : "text-slate-500",
                          )}
                        >
                          Doctor rating
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <RatingStars
                            rating={selectedDoctorMeta?.rating || 0}
                            darkMode={darkMode}
                          />
                          <span
                            className={cn(
                              "text-sm font-semibold",
                              darkMode ? "text-slate-100" : "text-slate-900",
                            )}
                          >
                            {selectedDoctorMeta?.rating.toFixed(1)}
                          </span>
                        </div>
                      </div>

                      <p
                        className={cn(
                          "text-xs",
                          darkMode ? "text-slate-500" : "text-slate-500",
                        )}
                      >
                        {selectedDoctorMeta?.reviews} reviews
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>

            <SectionCard darkMode={darkMode} className="p-4 sm:p-5 lg:p-6">
              <h2
                className={cn(
                  "text-lg font-semibold",
                  darkMode ? "text-white" : "text-slate-900",
                )}
              >
                Patient Information
              </h2>
              <p
                className={cn(
                  "mt-1 text-sm",
                  darkMode ? "text-slate-400" : "text-slate-500",
                )}
              >
                Live validation, phone formatting, local save, and final
                confirmation before secure payment.
              </p>

              <div className="mt-5 space-y-4">
                <div>
                  <input
                    placeholder="Full Name"
                    className={inputClass(darkMode, !!errors.fullName)}
                    value={patient.fullName}
                    onChange={(e) => setField("fullName", e.target.value)}
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-xs text-rose-400">
                      {errors.fullName}
                    </p>
                  )}
                </div>

                <div>
                  <input
                    placeholder="Email"
                    className={inputClass(darkMode, !!errors.email)}
                    value={patient.email}
                    onChange={(e) => setField("email", e.target.value)}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-rose-400">{errors.email}</p>
                  )}
                </div>

                <div>
                  <input
                    placeholder="Phone"
                    className={inputClass(darkMode, !!errors.phone)}
                    value={patient.phone}
                    onChange={(e) =>
                      setField("phone", formatPhoneInput(e.target.value))
                    }
                  />
                  {errors.phone && (
                    <p className="mt-1 text-xs text-rose-400">{errors.phone}</p>
                  )}
                </div>

                <textarea
                  placeholder="Notes (optional)"
                  rows={4}
                  className={`${inputClass(darkMode)} resize-none`}
                  value={patient.notes}
                  onChange={(e) => setField("notes", e.target.value)}
                />

                {!confirmOpen ? (
                  <button
                    type="button"
                    onClick={handleConfirmClick}
                    disabled={!selectedDate || !selectedTime}
                    className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-500 to-indigo-500 px-4 py-3.5 text-sm font-semibold text-slate-950 shadow-[0_18px_45px_rgba(14,165,233,0.25)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Review before payment
                  </button>
                ) : (
                  <div
                    className={cn(
                      "space-y-4 rounded-[24px] border p-4",
                      darkMode
                        ? "border-cyan-400/20 bg-cyan-500/10"
                        : "border-sky-200 bg-sky-50",
                    )}
                  >
                    <div>
                      <p
                        className={cn(
                          "text-sm font-semibold",
                          darkMode ? "text-cyan-100" : "text-sky-900",
                        )}
                      >
                        Final confirmation
                      </p>
                      <p
                        className={cn(
                          "mt-1 text-xs",
                          darkMode ? "text-cyan-200/70" : "text-sky-700",
                        )}
                      >
                        You are about to reserve{" "}
                        <strong>{selectedDoctor?.full_name || "—"}</strong> on{" "}
                        <strong>
                          {selectedDate ? formatDateLong(selectedDate) : "—"}
                        </strong>{" "}
                        at <strong>{selectedTime || "—"}</strong>.
                      </p>
                    </div>

                    <div
                      className={cn(
                        "rounded-2xl border px-4 py-3 text-sm",
                        darkMode
                          ? "border-emerald-500/15 bg-emerald-500/10 text-emerald-100"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700",
                      )}
                    >
                      Reservation fee:{" "}
                      <strong>${RESERVATION_FEE.toFixed(2)}</strong>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setConfirmOpen(false)}
                        className={cn(
                          "flex-1 rounded-2xl px-4 py-3 text-sm font-semibold transition hover:-translate-y-0.5",
                          darkMode
                            ? "border border-white/10 bg-white/[0.05] text-slate-100 hover:bg-white/[0.08]"
                            : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100",
                        )}
                      >
                        Edit
                      </button>

                      <button
                        onClick={createAppointment}
                        disabled={!formReady || submitting}
                        className="flex-1 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-500 to-indigo-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-[0_18px_45px_rgba(14,165,233,0.25)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {submitting ? "Processing..." : "Confirm & Pay"}
                      </button>
                    </div>
                  </div>
                )}

                <p
                  className={cn(
                    "text-center text-xs",
                    darkMode ? "text-slate-500" : "text-slate-500",
                  )}
                >
                  Your details are saved locally during this session for a
                  smoother premium experience.
                </p>
              </div>
            </SectionCard>
          </div>
        </div>

        {/* TRUST BAR */}
        <SectionCard darkMode={darkMode} className="p-4 sm:p-5 lg:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div
              className={cn(
                "flex items-center gap-4 rounded-[24px] border px-5 py-4",
                darkMode
                  ? "border-cyan-400/10 bg-cyan-500/8"
                  : "border-sky-100 bg-sky-50/60",
              )}
            >
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-2xl text-xl shadow-sm",
                  darkMode ? "bg-white/[0.05]" : "bg-white",
                )}
              >
                🔒
              </div>
              <div>
                <p
                  className={cn(
                    "font-semibold",
                    darkMode ? "text-white" : "text-slate-900",
                  )}
                >
                  Secure & Confidential
                </p>
                <p
                  className={cn(
                    "text-sm",
                    darkMode ? "text-slate-400" : "text-slate-500",
                  )}
                >
                  Protected booking and payment flow
                </p>
              </div>
            </div>

            <div
              className={cn(
                "flex items-center gap-4 rounded-[24px] border px-5 py-4",
                darkMode
                  ? "border-amber-400/10 bg-amber-500/8"
                  : "border-amber-100 bg-amber-50/60",
              )}
            >
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-2xl text-xl shadow-sm",
                  darkMode ? "bg-white/[0.05]" : "bg-white",
                )}
              >
                ⚡
              </div>
              <div>
                <p
                  className={cn(
                    "font-semibold",
                    darkMode ? "text-white" : "text-slate-900",
                  )}
                >
                  Smart booking flow
                </p>
                <p
                  className={cn(
                    "text-sm",
                    darkMode ? "text-slate-400" : "text-slate-500",
                  )}
                >
                  Calendar, filters, grouped slots, and final confirmation
                </p>
              </div>
            </div>

            <div
              className={cn(
                "flex items-center gap-4 rounded-[24px] border px-5 py-4",
                darkMode
                  ? "border-emerald-400/10 bg-emerald-500/8"
                  : "border-emerald-100 bg-emerald-50/60",
              )}
            >
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-2xl text-xl shadow-sm",
                  darkMode ? "bg-white/[0.05]" : "bg-white",
                )}
              >
                ⏱
              </div>
              <div>
                <p
                  className={cn(
                    "font-semibold",
                    darkMode ? "text-white" : "text-slate-900",
                  )}
                >
                  Live availability
                </p>
                <p
                  className={cn(
                    "text-sm",
                    darkMode ? "text-slate-400" : "text-slate-500",
                  )}
                >
                  Refresh slots anytime and reduce double booking risk
                </p>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
