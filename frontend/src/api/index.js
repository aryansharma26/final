import API from './axios.js';

export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  logout: () => API.post('/auth/logout'),
  refresh: () => API.post('/auth/refresh'),
  getMe: () => API.get('/auth/me'),
  forgotPassword: (data) => API.post('/auth/forgot-password', data),
  resetPassword: (data) => API.post('/auth/reset-password', data),
};

export const userAPI = {
  getProfile: () => API.get('/users/profile'),
  updateProfile: (data) => API.put('/users/profile', data),
  changePassword: (data) => API.put('/users/password', data),
  addAddress: (data) => API.post('/users/address', data),
  updateAddress: (id, data) => API.put(`/users/address/${id}`, data),
  deleteAddress: (id) => API.delete(`/users/address/${id}`),
};

export const productAPI = {
  getProducts: (params) => API.get('/products', { params }),
  getSearchSuggestions: (q, options = {}) => API.get('/products/suggestions', { params: { q }, ...options }),
  getProductBySlug: (slug) => API.get(`/products/slug/${slug}`),
  getProductById: (id) => API.get(`/products/${id}`),
  getFeatured: () => API.get('/products/featured'),
  getBrands: () => API.get('/products/brands'),
  updateOfferStatus: (id, showInOffers) => API.patch(`/products/${id}/offer`, { showInOffers }, { _admin: true }),
};

export const categoryAPI = {
  getCategories: () => API.get('/categories'),
  getAllCategoriesAdmin: () => API.get('/categories/admin/all', { _admin: true }),
  createCategory: (data) => API.post('/categories', data, { _admin: true }),
  updateCategory: (id, data) => API.put(`/categories/${id}`, data, { _admin: true }),
  deleteCategory: (id) => API.delete(`/categories/${id}`, { _admin: true }),
};

export const b2bCategoryAPI = {
  getCategories: () => API.get('/b2b-categories'),
  getAllCategoriesAdmin: () => API.get('/b2b-categories/admin/all', { _admin: true }),
  createCategory: (data) => API.post('/b2b-categories', data, { _admin: true }),
  updateCategory: (id, data) => API.put(`/b2b-categories/${id}`, data, { _admin: true }),
  deleteCategory: (id) => API.delete(`/b2b-categories/${id}`, { _admin: true }),
};

export const cartAPI = {
  getCart: () => API.get('/cart'),
  addToCart: (data) => API.post('/cart/add', data),
  updateItem: (data) => API.put('/cart/update', data),
  removeItem: (productId) => API.delete(`/cart/remove/${productId}`),
  clearCart: () => API.delete('/cart/clear'),
  applyCoupon: (data) => API.post('/cart/coupon', data),
  removeCoupon: () => API.delete('/cart/coupon'),
};

export const wishlistAPI = {
  getWishlist: () => API.get('/wishlist'),
  addToWishlist: (data) => API.post('/wishlist/add', data),
  removeFromWishlist: (productId) => API.delete(`/wishlist/remove/${productId}`),
};

export const orderAPI = {
  createOrder: (data) => API.post('/orders', data),
  verifyPayment: (data) => API.post('/orders/verify-payment', data),
  getMyOrders: () => API.get('/orders/my-orders'),
  getOrderById: (id) => API.get(`/orders/${id}`),
  cancelOrder: (id) => API.put(`/orders/${id}/cancel`),
  uploadSeniorDoc: (formData) => API.post('/orders/upload-senior-doc', formData, { headers: { 'Content-Type': undefined } }),
  verifySeniorCitizenDoc: (id, data) => API.put(`/orders/admin/${id}/verify-senior`, data, { _admin: true }),
};

export const reviewAPI = {
  createReview: (data) => API.post('/reviews', data),
  getProductReviews: (productId) => API.get(`/reviews/product/${productId}`),
  getMyReviews: () => API.get('/reviews/my-reviews'),
};

export const couponAPI = {
  getActiveCoupons: () => API.get('/coupons/active'),
  validateCoupon: (data) => API.post('/coupons/validate', data),
};

export const b2bCouponAPI = {
  getActiveCoupons: () => API.get('/b2b-coupons/active'),
  validateCoupon: (data) => API.post('/b2b-coupons/validate', data),
};

export const prescriptionAPI = {
  uploadPrescription: (formData) => API.post('/prescriptions/upload', formData, { headers: { 'Content-Type': undefined } }),
  getMyPrescriptions: () => API.get('/prescriptions/my-prescriptions'),
  getPrescriptionStatus: (params) => API.get('/prescriptions/status', { params }),
  viewMyPrescription: (id) => API.get(`/prescriptions/${id}/view`, { responseType: 'blob' }),
  downloadMyPrescription: (id) => API.get(`/prescriptions/${id}/download`, { responseType: 'blob' }),
  createOrderFromQuote: (id) => API.post(`/prescriptions/${id}/order`),
  getAllPrescriptions: (params) => API.get('/prescriptions/admin', { params, _admin: true }),
  getPrescriptionStats: () => API.get('/prescriptions/admin/stats', { _admin: true }),
  reviewPrescription: (id, data) => API.put(`/prescriptions/admin/${id}/review`, data, { _admin: true }),
  updatePrescriptionQuote: (id, data) => API.put(`/prescriptions/admin/${id}/quote`, data, { _admin: true }),
  deletePrescription: (id) => API.delete(`/prescriptions/admin/${id}`, { _admin: true }),
  viewPrescription: (id) => API.get(`/prescriptions/admin/${id}/view`, { responseType: 'blob', _admin: true }),
  downloadPrescription: (id) => API.get(`/prescriptions/admin/${id}/download`, { responseType: 'blob', _admin: true }),
};

export const doctorAPI = {
  getDoctors: (params) => API.get('/doctors', { params }),
  getDoctorBySlug: (slug) => API.get(`/doctors/slug/${slug}`),
  getFeaturedDoctors: () => API.get('/doctors/featured'),
  getEmergencyDoctors: () => API.get('/doctors/emergency'),
  getSpecialties: () => API.get('/doctors/specialties'),
  getRegions: () => API.get('/doctors/regions'),
  getProvincesByRegion: (regionId) => API.get(`/doctors/regions/${regionId}/provinces`),
  getCitiesByProvince: (provinceId) => API.get(`/doctors/provinces/${provinceId}/cities`),
  // Admin
  getAllDoctorsAdmin: (params) => API.get('/doctors/admin/all', { params, _admin: true }),
  createDoctor: (formData) => API.post('/doctors/admin', formData, { headers: { 'Content-Type': undefined }, _admin: true }),
  updateDoctor: (id, formData) => API.put(`/doctors/admin/${id}`, formData, { headers: { 'Content-Type': undefined }, _admin: true }),
  deleteDoctor: (id) => API.delete(`/doctors/admin/${id}`, { _admin: true }),
  // Specialties Admin
  getAllSpecialtiesAdmin: () => API.get('/doctors/admin/specialties', { _admin: true }),
  createSpecialty: (data) => API.post('/doctors/admin/specialties', data, { _admin: true }),
  updateSpecialty: (id, data) => API.put(`/doctors/admin/specialties/${id}`, data, { _admin: true }),
  deleteSpecialty: (id) => API.delete(`/doctors/admin/specialties/${id}`, { _admin: true }),
  // Regions Admin
  getAllRegionsAdmin: () => API.get('/doctors/admin/regions', { _admin: true }),
  createRegion: (data) => API.post('/doctors/admin/regions', data, { _admin: true }),
  updateRegion: (id, data) => API.put(`/doctors/admin/regions/${id}`, data, { _admin: true }),
  deleteRegion: (id) => API.delete(`/doctors/admin/regions/${id}`, { _admin: true }),
  // Provinces Admin
  getAllProvincesAdmin: () => API.get('/doctors/admin/provinces', { _admin: true }),
  createProvince: (data) => API.post('/doctors/admin/provinces', data, { _admin: true }),
  updateProvince: (id, data) => API.put(`/doctors/admin/provinces/${id}`, data, { _admin: true }),
  deleteProvince: (id) => API.delete(`/doctors/admin/provinces/${id}`, { _admin: true }),
  // Cities Admin
  getAllCitiesAdmin: () => API.get('/doctors/admin/cities', { _admin: true }),
  createCity: (data) => API.post('/doctors/admin/cities', data, { _admin: true }),
  updateCity: (id, data) => API.put(`/doctors/admin/cities/${id}`, data, { _admin: true }),
  deleteCity: (id) => API.delete(`/doctors/admin/cities/${id}`, { _admin: true }),
};

export const contactAPI = {
  createContact: (data) => API.post('/contact', data),
  submitContact: (data) => API.post('/contact', data),
  getContacts: (params) => API.get('/contact', { params, _admin: true }),
  getContactById: (id) => API.get(`/contact/${id}`, { _admin: true }),
  toggleContactRead: (id) => API.put(`/contact/${id}/read`, null, { _admin: true }),
  deleteContact: (id) => API.delete(`/contact/${id}`, { _admin: true }),
};

export const b2bProductAPI = {
  getProducts: (params = {}) => API.get('/b2b-products', { params: { ...params, _t: Date.now() } }),
  getProductBySlug: (slug) => API.get(`/b2b-products/${slug}`, { params: { _t: Date.now() } }),
  // Admin
  getAllProducts: (params = {}) => API.get('/b2b-products', { params: { ...params, _t: Date.now() }, _admin: true }),
  createProduct: (formData) => API.post('/b2b-products', formData, { headers: { 'Content-Type': undefined }, _admin: true }),
  updateProduct: (id, formData) => API.put(`/b2b-products/${id}`, formData, { headers: { 'Content-Type': undefined }, _admin: true }),
  deleteProduct: (id) => API.delete(`/b2b-products/${id}`, { _admin: true }),
};

export const adminAPI = {
  login: (data) => API.post('/admin/login', data),
  logout: () => API.post('/admin/logout', null, { _admin: true }),
  getDashboard: () => API.get('/admin/dashboard'),
  getAdmins: () => API.get('/admin/admins'),
  createAdmin: (data) => API.post('/admin/admins', data),
  updateAdmin: (id, data) => API.put(`/admin/admins/${id}`, data),
  deleteAdmin: (id) => API.delete(`/admin/admins/${id}`),
  // Products
  getAllProducts: (params) => API.get('/products', { params, _admin: true }),
  createProduct: (formData) => API.post('/products', formData, { headers: { 'Content-Type': undefined }, _admin: true }),
  updateProduct: (id, formData) => API.put(`/products/${id}`, formData, { headers: { 'Content-Type': undefined }, _admin: true }),
  deleteProduct: (id) => API.delete(`/products/${id}`, { _admin: true }),
  // Orders
  getAllOrders: (params) => API.get('/orders', { params, _admin: true }),
  getB2BPurchaseReport: (params) => API.get('/orders/b2b-purchase-report', { params, _admin: true }),
  updateOrderStatus: (id, data) => API.put(`/orders/${id}/status`, data, { _admin: true }),
  getOrderStats: () => API.get('/orders/stats', { _admin: true }),
  // Users
  getAllUsers: (params) => API.get('/users', { params, _admin: true }),
  getUserCategoryPurchases: (params) => API.get('/users/category-purchases', { params, _admin: true }),
  getUserById: (id) => API.get(`/users/${id}`, { _admin: true }),
  updateUserStatus: (id, data) => API.put(`/users/${id}/status`, data, { _admin: true }),
  updateUserAdminNotes: (id, data) => API.put(`/users/${id}/admin-notes`, data, { _admin: true }),
  // Reviews
  getAllReviews: (params) => API.get('/reviews', { params, _admin: true }),
  toggleReviewApproval: (id) => API.put(`/reviews/${id}/approve`, null, { _admin: true }),
  deleteReview: (id) => API.delete(`/reviews/${id}/admin`, { _admin: true }),
  // Coupons
  getCoupons: () => API.get('/coupons', { _admin: true }),
  getCouponById: (id) => API.get(`/coupons/${id}`, { _admin: true }),
  createCoupon: (data) => API.post('/coupons', data, { _admin: true }),
  updateCoupon: (id, data) => API.put(`/coupons/${id}`, data, { _admin: true }),
  deleteCoupon: (id) => API.delete(`/coupons/${id}`, { _admin: true }),
  getB2BCoupons: () => API.get('/b2b-coupons', { _admin: true }),
  createB2BCoupon: (data) => API.post('/b2b-coupons', data, { _admin: true }),
  updateB2BCoupon: (id, data) => API.put(`/b2b-coupons/${id}`, data, { _admin: true }),
  deleteB2BCoupon: (id) => API.delete(`/b2b-coupons/${id}`, { _admin: true }),
  // Contacts
  getContacts: (params) => API.get('/contact', { params, _admin: true }),
  getContactById: (id) => API.get(`/contact/${id}`, { _admin: true }),
  toggleContactRead: (id) => API.put(`/contact/${id}/read`, null, { _admin: true }),
  deleteContact: (id) => API.delete(`/contact/${id}`, { _admin: true }),
};

export const settingAPI = {
  getPromoBanner: () => API.get('/settings/promo-banner'),
  updatePromoBanner: (data) => API.put('/settings/promo-banner', data, { _admin: true }),
};
