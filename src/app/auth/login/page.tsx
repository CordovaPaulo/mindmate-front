"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "react-toastify";
import axios from "axios";
import Navbar from "@/components/Navbar";
import api, { setAuthToken } from "@/lib/axios";
import styles from "./login.module.css";

export default function Login() {
  const router = useRouter();

  // State declarations
  const [iniCred, setIniCred] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isButtonActive, setIsButtonActive] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Refs
  const iniCredRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const loginButtonRef = useRef<HTMLButtonElement>(null);
  const forgotPasswordRef = useRef<HTMLAnchorElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Constants
  const focusableElements = [
    { ref: iniCredRef, type: 'input' },
    { ref: passwordRef, type: 'input' },
    { ref: loginButtonRef, type: 'button' },
    { ref: forgotPasswordRef, type: 'link' }
  ];

  // Effects
  useEffect(() => {
    iniCredRef.current?.focus();
  }, []);

  // Helper functions
  const setButtonActive = (active: boolean) => {
    if (!isLoading) {
      setIsButtonActive(active);
    }
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  // Navigation functions
  const focusNextElement = () => {
    const nextIndex = (focusedIndex + 1) % focusableElements.length;
    setFocusedIndex(nextIndex);
    focusableElements[nextIndex].ref.current?.focus();
  };

  const focusPreviousElement = () => {
    const prevIndex = focusedIndex === 0 ? focusableElements.length - 1 : focusedIndex - 1;
    setFocusedIndex(prevIndex);
    focusableElements[prevIndex].ref.current?.focus();
  };

  const handleElementFocus = (index: number) => {
    setFocusedIndex(index);
  };

  // Event handlers
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    switch (e.key) {
      case 'Tab':
        e.preventDefault();
        if (e.shiftKey) {
          focusPreviousElement();
        } else {
          focusNextElement();
        }
        break;

      case 'Enter':
        // prevent any default "submit-like" behavior and handle manually
        e.preventDefault();
        if (index === focusableElements.length - 1) {
          forgotPasswordRef.current?.click();
        } else {
          if (!isLoading) {
            login();
          }
        }
        break;

      case ' ':
        e.preventDefault();
        if (index === focusableElements.length - 2) {
          if (!isLoading) {
            login();
          }
        } else if (index === focusableElements.length - 1) {
          forgotPasswordRef.current?.click();
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        focusNextElement();
        break;

      case 'ArrowUp':
        e.preventDefault();
        focusPreviousElement();
        break;

      case 'Escape':
        setFocusedIndex(0);
        iniCredRef.current?.focus();
        break;
    }
  };

  const login = async () => {
    if (isLoading) return;
    // Basic client-side validation
    if (!iniCred.trim() || !password.trim()) {
      toast.error("Please enter your login and password.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await api.post("/api/auth/login", {
        iniCred: iniCred.trim(),
        password: password,
      });

      const { token, userRole, user } = response.data || {};
      if (!token) {
        toast.error(response.data?.message || "Login failed. Please try again.");
        return;
      }

      setAuthToken(token);

      const role = userRole || user?.role;
      // Success toast
      const who = user?.username ? `, ${user.username}` : "";
      toast.success(`Welcome back${who}!`);

      if (!role || role === "user" || role === "") {
        toast.info("Please complete your profile to continue.");
        router.replace("/auth/signup");
        return;
      }

      switch (role) {
        case "learner":
          toast.success("Logged in as learner. Redirecting...");
          router.replace("/learner");
          break;
        case "mentor":
          toast.success("Logged in as mentor. Redirecting...");
          router.replace("/mentor");
          break;
        case "admin":
          toast.success("Logged in as admin. Redirecting...");
          router.replace("/admin");
          break;
        default:
          router.replace("/signup");
      }
    } catch (error: unknown) {
      // Use server message when available (401/403/etc), else fallback
      if (axios.isAxiosError(error)) {
        const msg =
          error.response?.data?.message ||
          (error.response?.status === 401
            ? "Invalid credentials. Please try again."
            : error.message);
        toast.error(msg);
        console.error("Login failed:", {
          status: error.response?.status,
          data: error.response?.data,
        });
      } else {
        toast.error("An unexpected error occurred. Please try again.");
        console.error("Login failed:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // JSX Return
  return (
    <div className={styles.container}>
      <Navbar />

      <main className={styles.main}>
        <div className={styles.mainImage}>
          <Image
            src="/logo_gccoed.png"
            alt="MindMates Logo"
            width={400}
            height={300}
            priority
          />
        </div>

        <div className={styles.mainContent}>
          <h1>Login</h1>
          <div role="form" aria-label="Login form" className={styles.form}>
            <div className={styles.inputField}>
              <label htmlFor="iniCred">DOMAIN LOGIN</label>
              <div className={styles.inputWithIcon}>
                <input
                  ref={iniCredRef}
                  id="iniCred"
                  type="text"
                  value={iniCred}
                  onChange={(e) => setIniCred(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 0)}
                  onFocus={() => handleElementFocus(0)}
                  placeholder="Enter your email, username, or Student ID"
                  disabled={isLoading}
                  required
                  aria-describedby="iniCred-description"
                />
                <i className={`fas fa-user ${styles.inputIcon}`}></i>
              </div>
              <span id="iniCred-description" className={styles.srOnly}>
                Enter your email, username, or Student ID
              </span>
            </div>

            <div className={styles.inputField}>
              <label htmlFor="password">PASSWORD</label>
              <div className={styles.inputWithIcon}>
                <input
                  ref={passwordRef}
                  id="password"
                  type={passwordVisible ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 1)}
                  onFocus={() => handleElementFocus(1)}
                  placeholder="Enter your password"
                  disabled={isLoading}
                  required
                  aria-describedby="password-description"
                />
                <i
                  className={`${styles.inputIcon} ${styles.passwordToggle} fas ${
                    passwordVisible ? "fa-eye" : "fa-eye-slash"
                  }`}
                  onClick={togglePasswordVisibility}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      togglePasswordVisibility();
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={passwordVisible ? "Hide password" : "Show password"}
                  aria-controls="password"
                ></i>
              </div>
              <span id="password-description" className={styles.srOnly}>
                Enter your password. Use Tab to navigate to next field.
              </span>
              <p className={styles.switchLink}>
                <a
                  href="/auth/forgot-password"
                  ref={forgotPasswordRef}
                  onKeyDown={(e) => handleKeyDown(e, 3)}
                  onFocus={() => handleElementFocus(3)}
                >
                  Forgot Password?
                </a>
              </p>
            </div>

            <button
              ref={loginButtonRef}
              type="button"
              className={`${styles.button} ${isLoading ? styles.loading : ""} ${
                isButtonActive ? styles.active : ""
              }`}
              onMouseDown={() => setButtonActive(true)}
              onMouseUp={() => setButtonActive(false)}
              onMouseLeave={() => setButtonActive(false)}
              onKeyDown={(e) => handleKeyDown(e, 2)}
              onFocus={() => handleElementFocus(2)}
              disabled={isLoading}
              aria-busy={isLoading}
              onClick={login}
              aria-label="Login to your account"
            >
              {isLoading && <span className={styles.loadingSpinner}></span>}
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}