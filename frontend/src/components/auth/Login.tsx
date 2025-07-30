// import React, { useState } from 'react';
// import { useFormik } from 'formik';
// import * as Yup from 'yup';
// import api from '../../services/api';

// interface LoginProps {
//   onLogin: (user: any) => void;
// }

// const validationSchema = Yup.object({
//   email: Yup.string()
//     .email('Please enter a valid email address')
//     .required('Email is required'),
//   password: Yup.string()
//     .min(6, 'Password must be at least 6 characters')
//     .required('Password is required'),
// });

// const initialValues = {
//   email: '',
//   password: ''
// };

// const Login: React.FC<LoginProps> = ({ onLogin }) => {
//   const [loading, setLoading] = useState(false);
//   const [loginErrorMsg, setLoginErrorMsg] = useState('');
//   const [showPassword, setShowPassword] = useState(false);

//   const formik = useFormik({
//     initialValues: initialValues,
//     validationSchema: validationSchema,
//     onSubmit: async (values) => {
//       setLoading(true);
//       setLoginErrorMsg('');

//       try {
//         const response = await api.post('/api/v1/auth/login', values);

//         if (response.data.success) {
//           localStorage.setItem('navihire_token', response.data.token);
//           localStorage.setItem('navihire_user', JSON.stringify(response.data.user));
//           onLogin(response.data.user);
//         } else {
//           setLoginErrorMsg(response.data.message || 'Login failed');
//         }
//       } catch (error: any) {
//         setLoginErrorMsg(error.response?.data?.message || 'Login failed. Please try again.');
//       } finally {
//         setLoading(false);
//       }
//     },
//   });

//   const handleDemoLogin = () => {
//     formik.setValues({
//       email: 'hrdemo@navikenz.com',
//       password: 'login123'
//     });
//   };

//   return (
//     <>
//       {/* Error Snackbar */}
//       {loginErrorMsg && (
//         <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center">
//           <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//           </svg>
//           {loginErrorMsg}
//           <button 
//             onClick={() => setLoginErrorMsg('')}
//             className="ml-4 text-white hover:text-gray-200"
//           >
//             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//             </svg>
//           </button>
//         </div>
//       )}

//       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 py-12">
//         <div className="w-full max-w-md">
//           {/* Logo Section */}
//           <div className="text-center mb-8">
//             <div className="bg-white rounded-2xl p-6 shadow-lg mb-6 inline-block">
//               <img
//                 className="mx-auto h-30 w-auto"
//                 src="/images/navihire-logo.svg"
//                 alt="NaviHire Logo"
//                 style={{ width: '250px', height: 'auto' }}
//               />
//             </div>
//             <h1 className="text-3xl font-bold text-gray-900 mb-2">
//               Welcome Back
//             </h1>
//             <p className="text-gray-600">Sign in to access your account</p>
//           </div>

//           {/* Main Login Card */}
//           <div className="bg-white shadow-2xl rounded-2xl p-8 space-y-6">
//             {/* Login Form */}
//             <form className="space-y-5" onSubmit={formik.handleSubmit}>
//               <div>
//                 <label className="block text-sm font-semibold text-gray-700 mb-2">
//                   Email Address
//                 </label>
//                 <div className="relative">
//                   <input
//                     name="email"
//                     type="email"
//                     placeholder="Enter your email"
//                     value={formik.values.email}
//                     onChange={formik.handleChange}
//                     onBlur={formik.handleBlur}
//                     className={`w-full px-4 py-3 pl-12 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
//                       formik.touched.email && formik.errors.email
//                         ? 'border-red-500 bg-red-50'
//                         : 'border-gray-300 hover:border-gray-400'
//                     }`}
//                     disabled={loading}
//                   />
//                   <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
//                   </svg>
//                 </div>
//                 {formik.touched.email && formik.errors.email && (
//                   <p className="mt-1 text-sm text-red-600 flex items-center">
//                     <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                     </svg>
//                     {formik.errors.email}
//                   </p>
//                 )}
//               </div>

//               <div>
//                 <label className="block text-sm font-semibold text-gray-700 mb-2">
//                   Password
//                 </label>
//                 <div className="relative">
//                   <input
//                     name="password"
//                     type={showPassword ? 'text' : 'password'}
//                     placeholder="Enter your password"
//                     value={formik.values.password}
//                     onChange={formik.handleChange}
//                     onBlur={formik.handleBlur}
//                     className={`w-full px-4 py-3 pl-12 pr-12 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
//                       formik.touched.password && formik.errors.password
//                         ? 'border-red-500 bg-red-50'
//                         : 'border-gray-300 hover:border-gray-400'
//                     }`}
//                     disabled={loading}
//                   />
//                   <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
//                   </svg>
//                   <button
//                     type="button"
//                     onClick={() => setShowPassword(!showPassword)}
//                     className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
//                   >
//                     {showPassword ? (
//                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464m1.414 1.414L8.464 8.464m5.656 5.656l1.415 1.415m-1.415-1.415l1.415 1.415M14.122 14.122L15.536 15.536" />
//                       </svg>
//                     ) : (
//                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
//                       </svg>
//                     )}
//                   </button>
//                 </div>
//                 {formik.touched.password && formik.errors.password && (
//                   <p className="mt-1 text-sm text-red-600 flex items-center">
//                     <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                     </svg>
//                     {formik.errors.password}
//                   </p>
//                 )}
//               </div>

//               <button
//                 type="submit"
//                 disabled={loading || !formik.isValid}
//                 className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 ${
//                   loading || !formik.isValid
//                     ? "bg-gray-400 cursor-not-allowed"
//                     : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
//                 }`}
//               >
//                 {loading ? (
//                   <div className="flex items-center justify-center">
//                     <svg
//                       className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
//                       xmlns="http://www.w3.org/2000/svg"
//                       fill="none"
//                       viewBox="0 0 24 24"
//                     >
//                       <circle
//                         className="opacity-25"
//                         cx="12"
//                         cy="12"
//                         r="10"
//                         stroke="currentColor"
//                         strokeWidth="4"
//                       ></circle>
//                       <path
//                         className="opacity-75"
//                         fill="currentColor"
//                         d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                       ></path>
//                     </svg>
//                     Signing In...
//                   </div>
//                 ) : (
//                   <span className="flex items-center justify-center">
//                     <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
//                     </svg>
//                     Sign In
//                   </span>
//                 )}
//               </button>
//             </form>

//             {/* Demo Credentials Section */}
//             <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
//               <div className="flex items-center justify-between mb-3">
//                 <div className="flex items-center">
//                   <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
//                   </svg>
//                   <span className="text-sm font-semibold text-gray-700">Demo Credentials</span>
//                 </div>
//                 <button
//                   type="button"
//                   onClick={handleDemoLogin}
//                   className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
//                 >
//                   <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
//                   </svg>
//                   Auto Fill
//                 </button>
//               </div>
//               <div className="text-xs text-gray-600 space-y-1">
//                 <div className="flex items-center">
//                   <span className="font-medium w-16">Email:</span>
//                   <span className="font-mono bg-white px-2 py-1 rounded border">hrdemo@navikenz.com</span>
//                 </div>
//                 <div className="flex items-center">
//                   <span className="font-medium w-16">Password:</span>
//                   <span className="font-mono bg-white px-2 py-1 rounded border">login123</span>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Footer */}
//           <div className="text-center mt-6">
//             <p className="text-xs text-gray-500">
//               2025 | © Navikenz | All Rights Reserved
//             </p>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// export default Login;

import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import api from '../../services/api';

interface LoginProps {
  onLogin: (user: any) => void;
}

const validationSchema = Yup.object({
  email: Yup.string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
});

const initialValues = {
  email: '',
  password: ''
};

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [loginErrorMsg, setLoginErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const formik = useFormik({
    initialValues: initialValues,
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      setLoginErrorMsg('');

      try {
        const response = await api.post('/api/v1/auth/login', values);

        if (response.data.success) {
          const userData = {
            name: response.data.user.name || response.data.user.display_name || 'User',
            email: response.data.user.email,
            role: response.data.user.role
          };

          localStorage.setItem('navihire_token', response.data.token);
          localStorage.setItem('navihire_user', JSON.stringify(userData));
          onLogin(userData);
        } else {
          setLoginErrorMsg(response.data.message || 'Login failed');
        }
      } catch (error: any) {
        setLoginErrorMsg(error.response?.data?.message || 'Login failed. Please try again.');
      } finally {
        setLoading(false);
      }
    },
  });

  const handleDemoLogin = () => {
    formik.setValues({
      email: 'hrdemo@navikenz.com',
      password: 'login123'
    });
  };

  return (
    <>
      {/* Error Snackbar */}
      {loginErrorMsg && (
        <div className="login-error-snackbar">
          <svg className="login-error-snackbar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {loginErrorMsg}
          <button
            onClick={() => setLoginErrorMsg('')}
            className="login-error-snackbar-close"
          >
            <svg className="login-error-close-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="login-container">
        <div className="login-wrapper">
          {/* Logo Section */}
          <div className="login-logo-section">
            <div className="login-logo-container">
              <img
                className="login-logo"
                src="/images/navihire-logo.svg"
                alt="NaviHire Logo"
                style={{ width: '250px', height: 'auto' }}
              />
            </div>
            <h1 className="login-title">Welcome Back</h1>
            <p className="login-subtitle">Sign in to access your account</p>
          </div>

          {/* Main Login Card */}
          <div className="login-card">
            {/* Login Form */}
            <form className="login-form" onSubmit={formik.handleSubmit}>
              <div className="login-form-group">
                <label className="login-form-label">Email Address</label>
                <div className="login-input-container">
                  <input
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`login-form-input ${formik.touched.email && formik.errors.email ? 'error' : ''
                      }`}
                    disabled={loading}
                  />
                  <svg className="login-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                {formik.touched.email && formik.errors.email && (
                  <p className="login-error-message">
                    <svg className="login-error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {formik.errors.email}
                  </p>
                )}
              </div>

              <div className="login-form-group">
                <label className="login-form-label">Password</label>
                <div className="login-input-container">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`login-form-input password-input ${formik.touched.password && formik.errors.password ? 'error' : ''
                      }`}
                    disabled={loading}
                  />
                  <svg className="login-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="login-password-toggle"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464m1.414 1.414L8.464 8.464m5.656 5.656l1.415 1.415m-1.415-1.415l1.415 1.415M14.122 14.122L15.536 15.536" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {formik.touched.password && formik.errors.password && (
                  <p className="login-error-message">
                    <svg className="login-error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {formik.errors.password}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !formik.isValid}
                className={`login-submit-button ${loading || !formik.isValid ? "disabled" : "enabled"
                  }`}
              >
                {loading ? (
                  <div className="login-button-content">
                    <svg className="login-loading-spinner" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Signing In...
                  </div>
                ) : (
                  <span className="login-button-content">
                    <svg className="login-button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Sign In
                  </span>
                )}
              </button>
            </form>

            {/* Demo Credentials Section */}
            <div className="login-demo-section">
              <div className="login-demo-header">
                <div className="login-demo-title">
                  <svg className="login-demo-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="login-demo-title-text">Demo Credentials</span>
                </div>
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  className="login-demo-button"
                >
                  <svg className="login-demo-button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Auto Fill
                </button>
              </div>
              <div className="login-demo-credentials">
                <div className="login-demo-credential-row">
                  <span className="login-demo-credential-label">Email:</span>
                  <span className="login-demo-credential-value">hrdemo@navikenz.com</span>
                </div>
                <div className="demo-credential-row">
                  <span className="demo-credential-label">Password:</span>
                  <span className="demo-credential-value">login123</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="login-footer">
            <p>2025 | © Navikenz | All Rights Reserved</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
