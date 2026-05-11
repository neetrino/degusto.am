'use client';

/**
 * UserAvatar Component
 * 
 * Displays a user avatar with initials placeholder.
 * If avatarUrl is provided, shows the image, otherwise shows initials.
 * 
 * @param firstName - User's first name
 * @param lastName - User's last name
 * @param avatarUrl - Optional URL to user's avatar image
 * @param size - Size of the avatar (default: 'md')
 */
interface UserAvatarProps {
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function UserAvatar({ 
  firstName, 
  lastName, 
  avatarUrl, 
  size = 'md',
  className = '' 
}: UserAvatarProps) {
  // Generate initials from first and last name
  const getInitials = (): string => {
    const firstInitial = firstName?.charAt(0)?.toUpperCase() || '';
    const lastInitial = lastName?.charAt(0)?.toUpperCase() || '';
    
    if (firstInitial && lastInitial) {
      return `${firstInitial}${lastInitial}`;
    } else if (firstInitial) {
      return firstInitial;
    } else if (lastInitial) {
      return lastInitial;
    }
    return '?';
  };

  // Size classes
  const sizeClasses = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-16 h-16 text-lg',
    lg: 'w-24 h-24 text-2xl',
    xl: 'w-32 h-32 text-3xl',
  };

  const initials = getInitials();

  return (
    <div className={`relative shrink-0 rounded-full ${sizeClasses[size]} ${className}`}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={`${firstName || ''} ${lastName || ''}`.trim() || 'User avatar'}
          className="w-full h-full rounded-full object-cover border-2 border-gray-200"
        />
      ) : (
        <div className="relative h-full w-full rounded-full border border-gray-300 bg-gray-100 shadow-[0_0_0_2px_rgba(255,255,255,0.95),0_0_0_4px_rgba(0,0,0,0.2)]">
          <div className="absolute inset-[5%] rounded-full bg-black">
            {initials !== '?' && (
              <span className="absolute left-1/2 top-[36%] -translate-x-1/2 -translate-y-1/2 text-[0.38em] font-semibold tracking-wide text-white/80">
                {initials}
              </span>
            )}
            <svg
              className="absolute left-1/2 top-1/2 h-[64%] w-[64%] -translate-x-1/2 -translate-y-1/2 text-white"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden={true}
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8H4z" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}



