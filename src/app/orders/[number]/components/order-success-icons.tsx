type IconProps = {
  className?: string;
};

export function SuccessCheckIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M20 6L9 17L4 12"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StepClockIcon({ className }: IconProps) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7V12L15 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function StepCheckIcon({ className }: IconProps) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 6L9 17L4 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StepPhoneIcon({ className }: IconProps) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M22 16.92V19.92C22.0011 20.1985 21.9441 20.4742 21.8325 20.7292C21.7209 20.9842 21.5573 21.2131 21.3523 21.4011C21.1473 21.5891 20.9053 21.732 20.6393 21.8207C20.3733 21.9094 20.0892 21.9418 19.81 21.9159C16.7428 21.5811 13.787 20.5306 11.19 18.8499C8.77382 17.3147 6.72533 15.2662 5.19 12.8499C3.49997 10.2412 2.44824 7.27099 2.12 4.18994C2.09413 3.91078 2.12653 3.62669 2.21523 3.36069C2.30393 3.09469 2.44684 2.85273 2.63482 2.64773C2.8228 2.44273 3.05172 2.27912 3.30672 2.16753C3.56172 2.05594 3.83743 1.99899 4.116 1.99994H7.116C7.68157 1.98944 8.23512 2.16393 8.69506 2.49952C9.155 2.83512 9.49782 3.31473 9.676 3.86994C9.94479 4.78626 10.3155 5.67019 10.78 6.50994C10.9867 6.89183 11.0672 7.33164 11.01 7.76494C10.9528 8.19824 10.7608 8.60612 10.46 8.93994L9.09 10.3099C10.5144 12.7895 12.7305 15.0056 15.21 16.4299L16.58 15.0599C16.9138 14.7592 17.3217 14.5672 17.755 14.51C18.1883 14.4528 18.6281 14.5333 19.01 14.7399C19.8498 15.2045 20.7337 15.5752 21.65 15.8439C22.2052 16.0221 22.6848 16.365 23.0204 16.8249C23.356 17.2849 23.5305 17.8384 23.52 18.4039L22 16.92Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HelpPhoneIcon({ className }: IconProps) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M22 16.92V19.92C22.0011 20.1985 21.9441 20.4742 21.8325 20.7292C21.7209 20.9842 21.5573 21.2131 21.3523 21.4011C21.1473 21.5891 20.9053 21.732 20.6393 21.8207C20.3733 21.9094 20.0892 21.9418 19.81 21.9159C16.7428 21.5811 13.787 20.5306 11.19 18.8499C8.77382 17.3147 6.72533 15.2662 5.19 12.8499C3.49997 10.2412 2.44824 7.27099 2.12 4.18994C2.09413 3.91078 2.12653 3.62669 2.21523 3.36069C2.30393 3.09469 2.44684 2.85273 2.63482 2.64773C2.8228 2.44273 3.05172 2.27912 3.30672 2.16753C3.56172 2.05594 3.83743 1.99899 4.116 1.99994H7.116C7.68157 1.98944 8.23512 2.16393 8.69506 2.49952C9.155 2.83512 9.49782 3.31473 9.676 3.86994C9.94479 4.78626 10.3155 5.67019 10.78 6.50994C10.9867 6.89183 11.0672 7.33164 11.01 7.76494C10.9528 8.19824 10.7608 8.60612 10.46 8.93994L9.09 10.3099C10.5144 12.7895 12.7305 15.0056 15.21 16.4299L16.58 15.0599C16.9138 14.7592 17.3217 14.5672 17.755 14.51C18.1883 14.4528 18.6281 14.5333 19.01 14.7399C19.8498 15.2045 20.7337 15.5752 21.65 15.8439C22.2052 16.0221 22.6848 16.365 23.0204 16.8249C23.356 17.2849 23.5305 17.8384 23.52 18.4039L22 16.92Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
