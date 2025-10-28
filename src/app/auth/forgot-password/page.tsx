"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import notify from '@/lib/toast';
import api from '@/lib/axios';
import styles from "./ForgotPassword.module.css";

export default function ForgotPasswordPage() {
  const router = useRouter();

  // State declarations
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Step 1 data
  const [identifier, setIdentifier] = useState("");
  
  // Step 2 data
  const [verificationData, setVerificationData] = useState({
    pre_cred: "",
    id: "",
    name: "",
    email: "",
    role: "",
    // secondary_role: "",
  });

  // Constants
  const roles = ["learner", "mentor"];

  // Handler functions
  const handleStep1 = async () => {
    if (!identifier) {
      setError("Please enter your email, ID number, or account name");
      return;
    }

    setLoading(true);
    setError("");

    setVerificationData((prev) => ({ ...prev, pre_cred: identifier }));

    setStep(2);
    setLoading(false);
  };

  const handleStep2 = async () => {
    const required = ["id", "name", "email", "role"];
    const missing = required.filter(
      (f) => !verificationData[f as keyof typeof verificationData]
    );

    if (missing.length > 0) {
      setError(`Please fill in all required fields: ${missing.join(", ")}`);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.post("/api/auth/forgot-password", verificationData);
      if (response.status === 200) {
        console.log("Password reset link sent:", response.data);
      }
      notify.success("Password reset link sent!");

      setSuccess("Password reset link sent!");
      router.push("/auth/login");
    } catch (err) {
      notify.error("Verification failed");
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  // JSX Return
  return (
    <div className={styles.forgotPasswordContainer}>
      <header className={styles.brandHeader}>
        <img
          src="/logo_gccoed.png"
          alt="GCCoed Logo"
          className={styles.logoImg}
        />
        <span className={styles.brandName}>MindMates</span>
      </header>

      <div className={styles.formWrapper}>
        {/* Step 1 */}
        {step === 1 && (
          <div className={styles.stepContainer}>
            <h2>Forgot Password</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleStep1();
              }}
            >
              <div className={styles.formGroup}>
                <div className={styles.inputWithIcon}>
                  <input
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Enter your Login Credential"
                    type="text"
                    required
                  />
                  <span className={styles.inputIcon}>👤</span>
                </div>
              </div>
              <button type="submit" disabled={loading}>
                {loading ? "Checking..." : "Continue"}
              </button>
            </form>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className={styles.stepContainer}>
            <h2>Forgot Password</h2>
            <p>Please verify your identity</p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleStep2();
              }}
            >
              <div className={styles.formGroup}>
                <div className={styles.inputWithIcon}>
                  <input
                    value={verificationData.id}
                    onChange={(e) =>
                      setVerificationData((prev) => ({
                        ...prev,
                        id: e.target.value,
                      }))
                    }
                    placeholder="ID Number"
                    type="text"
                    required
                  />
                  <span className={styles.inputIcon}>🇮🇩</span>
                </div>
              </div>

              <div className={styles.formGroup}>
                <div className={styles.inputWithIcon}>
                  <input
                    value={verificationData.name}
                    onChange={(e) =>
                      setVerificationData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Full Name"
                    type="text"
                    required
                  />
                  <span className={styles.inputIcon}>👤</span>
                </div>
              </div>

              <div className={styles.formGroup}>
                <div className={styles.inputWithIcon}>
                  <input
                    value={verificationData.email}
                    onChange={(e) =>
                      setVerificationData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    placeholder="Email"
                    type="email"
                    required
                  />
                  <span className={styles.inputIcon}>🖂</span>
                </div>
              </div>

              <div className={styles.formGroup}>
                <div className={styles.inputWithIcon}>
                <label htmlFor="roleSelect">Primary Role</label>
                <select
                  id="roleSelect"
                  name="role"
                  value={verificationData.role}
                  onChange={(e) =>
                    setVerificationData((prev) => ({
                      ...prev,
                      role: e.target.value as typeof prev.role,
                    }))
                  }
                  required
                >
                  <option value="">Select Primary Role</option>
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </option>
                  ))}
                </select>
                </div>
              </div>

              {/*
              <div className={styles.formGroup}>
                <div className={styles.inputWithIcon}>
                  <select
                    value={verificationData.secondary_role}
                    onChange={(e) =>
                      setVerificationData((prev) => ({
                        ...prev,
                        secondary_role: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select Secondary Role</option>
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <small className={styles.optionalNote}>*If applicable</small>
              </div>
              */}

              <button type="submit" disabled={loading}>
                {loading ? "Verifying..." : "Verify Identity"}
              </button>
            </form>
          </div>
        )}

        {/* Error and Success Messages */}
        {error && <div className={styles.errorMessage}>{error}</div>}
        {success && <div className={styles.successMessage}>{success}</div>}
      </div>
    </div>
  );
}