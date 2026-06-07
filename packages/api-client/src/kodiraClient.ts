import axios, { type AxiosInstance } from 'axios';
import type {
  AddLessonRequest,
  AddLessonResponse,
  AddSectionRequest,
  AddSectionResponse,
  AuthResponse,
  AuthTokens,
  Category,
  CreateCourseRequest,
  CreateCourseResponse,
  Course,
  DeleteLessonResponse,
  DeleteSectionResponse,
  EnrollCourseResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  GetCourseLessonsResponse,
  HealthResponse,
  LessonCompleteResponse,
  LessonProgressRequest,
  LessonProgressResponse,
  ListCoursesQuery,
  ListCoursesResponse,
  ListInstructorCoursesQuery,
  ListInstructorCoursesResponse,
  ListMyCoursesQuery,
  ListMyCoursesResponse,
  LoginRequest,
  LogoutResponse,
  PublishCourseResponse,
  RefreshRequest,
  RegisterRequest,
  StorageCreateUploadUrlRequest,
  StorageCreateUploadUrlResponse,
  UpdateCourseRequest,
  UpdateCourseResponse,
  UpdateLessonRequest,
  UpdateLessonResponse,
  UpdateSectionRequest,
  UpdateSectionResponse,
  UpdateMyProfileRequest,
  UserMe,
  PublicUserProfile,
  ApplySellerRequest,
  SellerProfileResponse,
  CreateSellerOfferingRequest,
  CreateSellerOfferingResponse,
  UpdateSellerOfferingRequest,
  UpdateSellerOfferingResponse,
  ListSellerOfferingsQuery,
  ListSellerOfferingsResponse,
  SubmitSellerOfferingResponse,
  CreateOfferingUploadUrlRequest,
  CreateOfferingUploadUrlResponse,
  CreateDigitalAssetRequest,
  CreateDigitalAssetResponse,
  ListPublicOfferingsQuery,
  ListPublicOfferingsResponse,
  GetPublicOfferingBySlugResponse,
  GetPublicSellerByIdResponse,
} from '@kodira/types';
import { createHttpClient, type CreateHttpClientOptions } from './http';

export interface AuthTokenStorage {
  getAccessToken: () => string | undefined | Promise<string | undefined>;
  getRefreshToken: () => string | undefined | Promise<string | undefined>;
  setTokens: (tokens: AuthTokens) => void | Promise<void>;
  clear: () => void | Promise<void>;
}

export interface CreateKodiraApiClientOptions extends CreateHttpClientOptions {
  tokenStorage?: AuthTokenStorage;
  onAuthInvalidated?: () => void;
}

export interface KodiraApiClient {
  http: AxiosInstance;
  health: {
    getHealth: () => Promise<HealthResponse>;
  };
  auth: {
    register: (body: RegisterRequest) => Promise<AuthResponse>;
    login: (body: LoginRequest) => Promise<AuthResponse>;
    refresh: (body: RefreshRequest) => Promise<AuthTokens>;
    logout: () => Promise<LogoutResponse>;
    forgotPassword: (body: ForgotPasswordRequest) => Promise<ForgotPasswordResponse>;
    clearSession: () => Promise<void>;
  };
  users: {
    getMe: () => Promise<UserMe>;
    updateMe: (body: UpdateMyProfileRequest) => Promise<UserMe>;
    getPublicProfile: (username: string) => Promise<PublicUserProfile>;
  };
  education: {
    listCourses: (query?: ListCoursesQuery) => Promise<ListCoursesResponse>;
    getCourseBySlug: (slug: string) => Promise<Course>;
    listCategories: () => Promise<Category[]>;
    enrollCourse: (courseId: string) => Promise<EnrollCourseResponse>;
    listMyCourses: (query?: ListMyCoursesQuery) => Promise<ListMyCoursesResponse>;
    listInstructorCourses: (
      query?: ListInstructorCoursesQuery,
    ) => Promise<ListInstructorCoursesResponse>;

    createCourse: (body: CreateCourseRequest) => Promise<CreateCourseResponse>;
    updateCourse: (courseId: string, body: UpdateCourseRequest) => Promise<UpdateCourseResponse>;
    publishCourse: (courseId: string) => Promise<PublishCourseResponse>;
    getCourseLessons: (courseId: string) => Promise<GetCourseLessonsResponse>;

    addSection: (courseId: string, body: AddSectionRequest) => Promise<AddSectionResponse>;
    updateSection: (
      courseId: string,
      sectionId: string,
      body: UpdateSectionRequest,
    ) => Promise<UpdateSectionResponse>;
    deleteSection: (courseId: string, sectionId: string) => Promise<DeleteSectionResponse>;

    addLesson: (
      courseId: string,
      sectionId: string,
      body: AddLessonRequest,
    ) => Promise<AddLessonResponse>;
    updateLesson: (
      courseId: string,
      sectionId: string,
      lessonId: string,
      body: UpdateLessonRequest,
    ) => Promise<UpdateLessonResponse>;
    deleteLesson: (
      courseId: string,
      sectionId: string,
      lessonId: string,
    ) => Promise<DeleteLessonResponse>;
  };
  lessons: {
    saveProgress: (lessonId: string, body: LessonProgressRequest) => Promise<LessonProgressResponse>;
    complete: (lessonId: string) => Promise<LessonCompleteResponse>;
  };
  storage: {
    createUploadUrl: (
      body: StorageCreateUploadUrlRequest,
    ) => Promise<StorageCreateUploadUrlResponse>;
  };
  marketplace: {
    listPublicOfferings: (query?: ListPublicOfferingsQuery) => Promise<ListPublicOfferingsResponse>;
    getPublicOfferingBySlug: (slug: string) => Promise<GetPublicOfferingBySlugResponse>;
    getPublicSellerById: (sellerId: string) => Promise<GetPublicSellerByIdResponse>;

    applySeller: (body: ApplySellerRequest) => Promise<SellerProfileResponse>;
    getMySellerProfile: () => Promise<SellerProfileResponse>;

    listMyOfferings: (query?: ListSellerOfferingsQuery) => Promise<ListSellerOfferingsResponse>;
    createOffering: (body: CreateSellerOfferingRequest) => Promise<CreateSellerOfferingResponse>;
    updateOffering: (
      offeringId: string,
      body: UpdateSellerOfferingRequest,
    ) => Promise<UpdateSellerOfferingResponse>;
    submitOffering: (offeringId: string) => Promise<SubmitSellerOfferingResponse>;
    pauseOffering: (offeringId: string) => Promise<SubmitSellerOfferingResponse>;
    unpauseOffering: (offeringId: string) => Promise<SubmitSellerOfferingResponse>;

    createOfferingUploadUrl: (
      offeringId: string,
      body: CreateOfferingUploadUrlRequest,
    ) => Promise<CreateOfferingUploadUrlResponse>;
    createDigitalAsset: (
      offeringId: string,
      body: CreateDigitalAssetRequest,
    ) => Promise<CreateDigitalAssetResponse>;
  };
}

export function createKodiraApiClient(
  options: CreateKodiraApiClientOptions = {},
): KodiraApiClient {
  const refreshHttp = axios.create({
    baseURL: options.baseURL,
    headers: { 'Content-Type': 'application/json' },
  });

  const tokenStorage = options.tokenStorage;
  const getAccessToken =
    options.getAccessToken ??
    (tokenStorage ? () => tokenStorage.getAccessToken() : undefined);

  const onRefreshError = async (err: unknown) => {
    options.onRefreshError?.(err);
    if (tokenStorage) await tokenStorage.clear();
    options.onAuthInvalidated?.();
  };

  const refreshAccessToken =
    options.refreshAccessToken ??
    (tokenStorage
      ? async () => {
          const refreshToken = await tokenStorage.getRefreshToken();
          if (!refreshToken) return undefined;
          try {
            const { data } = await refreshHttp.post<AuthTokens>(
              '/api/v1/auth/refresh',
              { refreshToken } satisfies RefreshRequest,
            );
            await tokenStorage.setTokens(data);
            return data.accessToken;
          } catch (err) {
            await onRefreshError(err);
            return undefined;
          }
        }
      : undefined);

  const http = createHttpClient({
    ...options,
    getAccessToken,
    refreshAccessToken,
    onRefreshError,
  });

  return {
    http,
    health: {
      async getHealth() {
        const { data } = await http.get<HealthResponse>('/api/v1/health');
        return data;
      },
    },
    auth: {
      async register(body) {
        const { data } = await http.post<AuthResponse>('/api/v1/auth/register', body);
        if (tokenStorage) await tokenStorage.setTokens(data.tokens);
        return data;
      },
      async login(body) {
        const { data } = await http.post<AuthResponse>('/api/v1/auth/login', body);
        if (tokenStorage) await tokenStorage.setTokens(data.tokens);
        return data;
      },
      async refresh(body) {
        const { data } = await refreshHttp.post<AuthTokens>('/api/v1/auth/refresh', body);
        if (tokenStorage) await tokenStorage.setTokens(data);
        return data;
      },
      async logout() {
        const { data } = await http.post<LogoutResponse>('/api/v1/auth/logout');
        if (tokenStorage) await tokenStorage.clear();
        return data;
      },
      async forgotPassword(body) {
        const { data } = await http.post<ForgotPasswordResponse>(
          '/api/v1/auth/forgot-password',
          body,
        );
        return data;
      },
      async clearSession() {
        if (tokenStorage) await tokenStorage.clear();
      },
    },
    users: {
      async getMe() {
        const { data } = await http.get<UserMe>('/api/v1/users/me');
        return data;
      },
      async updateMe(body) {
        const { data } = await http.put<UserMe>('/api/v1/users/me', body);
        return data;
      },
      async getPublicProfile(username) {
        const { data } = await http.get<PublicUserProfile>(`/api/v1/users/${username}`);
        return data;
      },
    },
    education: {
      async listCourses(query) {
        const { data } = await http.get<ListCoursesResponse>('/api/v1/courses', {
          params: query,
        });
        return data;
      },
      async getCourseBySlug(slug) {
        const { data } = await http.get<Course>(`/api/v1/courses/${slug}`);
        return data;
      },
      async listCategories() {
        const { data } = await http.get<Category[]>('/api/v1/courses/categories');
        return data;
      },
      async enrollCourse(courseId) {
        const { data } = await http.post<EnrollCourseResponse>(`/api/v1/courses/${courseId}/enroll`);
        return data;
      },
      async listMyCourses(query) {
        const { data } = await http.get<ListMyCoursesResponse>('/api/v1/me/courses', {
          params: query,
        });
        return data;
      },
      async listInstructorCourses(query) {
        const { data } = await http.get<ListInstructorCoursesResponse>(
          '/api/v1/me/instructor/courses',
          { params: query },
        );
        return data;
      },

      async createCourse(body) {
        const { data } = await http.post<CreateCourseResponse>('/api/v1/courses', body);
        return data;
      },
      async updateCourse(courseId, body) {
        const { data } = await http.put<UpdateCourseResponse>(`/api/v1/courses/${courseId}`, body);
        return data;
      },
      async publishCourse(courseId) {
        const { data } = await http.post<PublishCourseResponse>(`/api/v1/courses/${courseId}/publish`);
        return data;
      },
      async getCourseLessons(courseId) {
        const { data } = await http.get<GetCourseLessonsResponse>(`/api/v1/courses/${courseId}/lessons`);
        return data;
      },

      async addSection(courseId, body) {
        const { data } = await http.post<AddSectionResponse>(`/api/v1/courses/${courseId}/sections`, body);
        return data;
      },
      async updateSection(courseId, sectionId, body) {
        const { data } = await http.put<UpdateSectionResponse>(
          `/api/v1/courses/${courseId}/sections/${sectionId}`,
          body,
        );
        return data;
      },
      async deleteSection(courseId, sectionId) {
        const { data } = await http.delete<DeleteSectionResponse>(
          `/api/v1/courses/${courseId}/sections/${sectionId}`,
        );
        return data;
      },

      async addLesson(courseId, sectionId, body) {
        const { data } = await http.post<AddLessonResponse>(
          `/api/v1/courses/${courseId}/sections/${sectionId}/lessons`,
          body,
        );
        return data;
      },
      async updateLesson(courseId, sectionId, lessonId, body) {
        const { data } = await http.put<UpdateLessonResponse>(
          `/api/v1/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}`,
          body,
        );
        return data;
      },
      async deleteLesson(courseId, sectionId, lessonId) {
        const { data } = await http.delete<DeleteLessonResponse>(
          `/api/v1/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}`,
        );
        return data;
      },
    },
    lessons: {
      async saveProgress(lessonId, body) {
        const { data } = await http.post<LessonProgressResponse>(
          `/api/v1/lessons/${lessonId}/progress`,
          body,
        );
        return data;
      },
      async complete(lessonId) {
        const { data } = await http.post<LessonCompleteResponse>(`/api/v1/lessons/${lessonId}/complete`);
        return data;
      },
    },
    storage: {
      async createUploadUrl(body) {
        const { data } = await http.post<StorageCreateUploadUrlResponse>(
          '/api/v1/storage/upload-url',
          body,
        );
        return data;
      },
    },
    marketplace: {
      async listPublicOfferings(query) {
        const { data } = await http.get<ListPublicOfferingsResponse>('/api/v1/offerings', {
          params: query,
        });
        return data;
      },
      async getPublicOfferingBySlug(slug) {
        const { data } = await http.get<GetPublicOfferingBySlugResponse>(`/api/v1/offerings/${slug}`);
        return data;
      },
      async getPublicSellerById(sellerId) {
        const { data } = await http.get<GetPublicSellerByIdResponse>(`/api/v1/sellers/${sellerId}`);
        return data;
      },

      async applySeller(body) {
        const { data } = await http.post<SellerProfileResponse>('/api/v1/sellers/apply', body);
        return data;
      },
      async getMySellerProfile() {
        const { data } = await http.get<SellerProfileResponse>('/api/v1/me/seller');
        return data;
      },

      async listMyOfferings(query) {
        const { data } = await http.get<ListSellerOfferingsResponse>('/api/v1/me/seller/offerings', {
          params: query,
        });
        return data;
      },
      async createOffering(body) {
        const { data } = await http.post<CreateSellerOfferingResponse>('/api/v1/me/seller/offerings', body);
        return data;
      },
      async updateOffering(offeringId, body) {
        const { data } = await http.patch<UpdateSellerOfferingResponse>(
          `/api/v1/me/seller/offerings/${offeringId}`,
          body,
        );
        return data;
      },
      async submitOffering(offeringId) {
        const { data } = await http.post<SubmitSellerOfferingResponse>(
          `/api/v1/me/seller/offerings/${offeringId}/submit`,
        );
        return data;
      },
      async pauseOffering(offeringId) {
        const { data } = await http.post<SubmitSellerOfferingResponse>(
          `/api/v1/me/seller/offerings/${offeringId}/pause`,
        );
        return data;
      },
      async unpauseOffering(offeringId) {
        const { data } = await http.post<SubmitSellerOfferingResponse>(
          `/api/v1/me/seller/offerings/${offeringId}/unpause`,
        );
        return data;
      },

      async createOfferingUploadUrl(offeringId, body) {
        const { data } = await http.post<CreateOfferingUploadUrlResponse>(
          `/api/v1/me/seller/offerings/${offeringId}/asset/upload-url`,
          body,
        );
        return data;
      },
      async createDigitalAsset(offeringId, body) {
        const { data } = await http.post<CreateDigitalAssetResponse>(
          `/api/v1/me/seller/offerings/${offeringId}/asset`,
          body,
        );
        return data;
      },
    },
  };
}
