// LinkedIn Authentication Utility
export const handleLinkedInRegister = () => {
  // Force LinkedIn logout first to ensure fresh login
  const logoutWin = window.open("https://www.linkedin.com/m/logout/", "_blank", "width=600,height=400");

  // Increased timeout to handle slow loading
  setTimeout(() => {
    logoutWin?.close();
    // Redirect to LinkedIn OAuth with register parameter
    window.location.href = "/api/auth/linkedin?from=register";
  }, 3000); // Increased to 3 seconds for better reliability
};

export const handleLinkedInLogin = () => {
  // Force LinkedIn logout first to ensure fresh login
  const logoutWin = window.open("https://www.linkedin.com/m/logout/", "_blank", "width=600,height=400");

  setTimeout(() => {
    logoutWin?.close();
    // Redirect to LinkedIn OAuth for login
    window.location.href = "/api/auth/linkedin?from=login";
  }, 3000);
};

// LinkedIn logout utility functions
export const forceLinkedInLogout = (): Promise<void> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }

    console.log('🔗 LinkedIn-dən çıxış edilir...');

    // Open LinkedIn logout in hidden iframe to avoid popup blocking
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = 'https://www.linkedin.com/m/logout/';

    document.body.appendChild(iframe);

    // Clean up after timeout
    setTimeout(() => {
      try {
        document.body.removeChild(iframe);
        console.log('✅ LinkedIn logout tamamlandı');
      } catch (e) {
        console.log('⚠️ LinkedIn logout iframe təmizlənmədi:', e);
      }
      resolve();
    }, 2000);
  });
};

// Alternative method using popup
export const forceLinkedInLogoutPopup = (): Promise<void> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }

    console.log('🔗 LinkedIn-dən çıxış edilir (popup method)...');

    try {
      const logoutWin = window.open(
        "https://www.linkedin.com/m/logout/",
        "_blank",
        "width=1,height=1,left=-1000,top=-1000"
      );

      setTimeout(() => {
        try {
          logoutWin?.close();
          console.log('✅ LinkedIn logout popup bağlandı');
        } catch (e) {
          console.log('⚠️ LinkedIn logout popup bağlana bilmədi:', e);
        }
        resolve();
      }, 2000);
    } catch (error) {
      console.log('⚠️ LinkedIn logout popup yaradıla bilmədi:', error);
      resolve();
    }
  });
};

// Make it available globally to avoid Tawk.to plugin conflicts
if (typeof window !== 'undefined') {
  (window as any).linkedInAuth = {
    register: handleLinkedInRegister,
    login: handleLinkedInLogin
  };
}
