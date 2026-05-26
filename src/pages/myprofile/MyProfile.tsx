import { useEffect, useRef, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  MapPinned,
  UserCheck,
  School,
  Bookmark,
  FolderOpen,
} from "lucide-react";
import {
  PersonalDetails,
  LocationDetails,
  GuardianDetails,
  EducationDetails,
  CourseDetails,
  Documents,
} from "./components";
import type {
  LocationDetailsHandle,
  PersonalDetailsHandle,
  ProfileFormData,
} from "./components";
import { apiHeader, postData } from "@/utils/ApiHelper";
import { getEncodedCookie, toasterrormsg } from "@/utils/reusable";
import { GuardianDetailsHandle } from "./components/GuardianDetails";
import { EducationDetailsHandle } from "./components/EducationDetails";
import { CourseDetailsHandle } from "./components/CourseDetails";
import { DocumentDetailsHandle } from "./components/Documents";

const tabs = [
  { label: "Personal Details", icon: User, component: PersonalDetails },
  { label: "Location Details", icon: MapPinned, component: LocationDetails },
  { label: "Guardian Details", icon: UserCheck, component: GuardianDetails },
  { label: "Education Details", icon: School, component: EducationDetails },
  { label: "Course Details", icon: Bookmark, component: CourseDetails },
  { label: "Documents", icon: FolderOpen, component: Documents },
];

const MyProfile = () => {
  const [activeTab, setActiveTab] = useState("Personal Details");
  const [bannerInfo, setBannerInfo] = useState({
    fullName: "",
    email: "",
    mobile: "",
    traineeCode: "",
    profilePicture: "",
  });

  const personalRef = useRef<PersonalDetailsHandle | null>(null);
  const locationRef = useRef<LocationDetailsHandle | null>(null);
  const guardianRef = useRef<GuardianDetailsHandle | null>(null);
  const educationRef = useRef<EducationDetailsHandle | null>(null);
  const courseRef = useRef<CourseDetailsHandle | null>(null);
  const documentsRef = useRef<DocumentDetailsHandle | null>(null);

  const methods = useForm<ProfileFormData>({
    defaultValues: {
      traineeId: "",
      prefix: "",
      profilePhoto: null,
      firstName: "",
      middleName: "",
      lastName: "",
      gender: "",
      birthDate: null,
      email: "",
      mobile1: "",
      mobile2: "",
      userName: "",
      password: "",
      confirmPassword: "",
      stateId: "",
      cityId: "",
      address: "",
      guardians: [
        {
          traineeguardiandetailId: "",
          guardianType: "",
          relation: "",
          firstName: "",
          lastName: "",
          mobileNumber: "",
          mobileNumber2: "",
        },
      ],
      educations: [
        {
          traineeeducationdetailId: "",
          educationType: "",
          education: "",
          boardId: "",
          instituteId: "",
          passingYear: "",
          percentage: "",
          isCompleted: "0",
          document: "",
          url: "",
        },
      ],
      traineecourseId: "",
      course: "",
      enrollmentType: "",
      traineeArea: "",
      batchDay: "",
      batchTime: "",
      joiningDate: null,
      hasLaptop: null,
      computerId: "",
      aadharNumber: "",
      documents: [],
    },
  });

  const fetchPersonalDetails = async () => {
    const traineeId = getEncodedCookie("traineeId");
    if (!traineeId) return;

    const response: any = await postData(
      "trainee/personaldetail/get",
      { traineeId },
      apiHeader(false, 0),
    );

    if (
      String(response?.status) === "200" &&
      String(response.data?.status) === "200"
    ) {
      const data = response.data.data || {};
      methods.reset({
        ...methods.getValues(),
        traineeId: String(data.traineeId ?? traineeId),
        prefix: data.prefix || "",
        profilePhoto: null,
        firstName: data.firstName || "",
        middleName: data.middleName || "",
        lastName: data.lastName || "",
        gender: data.gender || "",
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        email: data.email || "",
        mobile1: data.mobileNumber || "",
        mobile2: data.mobileNumber2 || "",
        userName: data.username || "",
        password: "",
        confirmPassword: "",
        stateId: data.stateId ? String(data.stateId) : "",
        cityId: data.cityId ? String(data.cityId) : "",
        address: data.address || "",
        aadharNumber: data.aadharcardNumber || "",
      });

      const fullName = [
        data.prefix,
        data.firstName,
        data.middleName,
        data.lastName,
      ]
        .filter(Boolean)
        .join(" ");
      setBannerInfo({
        fullName,
        email: data.email || "",
        mobile: data.mobileNumber || "",
        traineeCode: data.traineeCode || "",
        profilePicture: data.profilePicture || "",
      });
    } else {
      toasterrormsg(response?.data?.message || "Failed to load profile");
    }
  };

  useEffect(() => {
    fetchPersonalDetails();
  }, []);

  const saveActiveTab = async (): Promise<boolean> => {
    if (activeTab === "Personal Details" && personalRef.current) {
      return personalRef.current.save();
    }
    if (activeTab === "Location Details" && locationRef.current) {
      return locationRef.current.save();
    }
    if (activeTab === "Guardian Details" && guardianRef.current) {
      return guardianRef.current.save();
    }
    if (activeTab === "Education Details" && educationRef.current) {
      return educationRef.current.save();
    }
    if (activeTab === "Course Details" && courseRef.current) {
      return courseRef.current.save();
    }
    if (activeTab === "Documents" && documentsRef.current) {
      return documentsRef.current.save();
    }
    return true;
  };

  const handleFinalSave = async () => {
    await saveActiveTab();
  };

  const currentTabIndex = tabs.findIndex((t) => t.label === activeTab);
  const ActiveComponent = tabs[currentTabIndex]?.component;

  const handleNext = async () => {
    const ok = await saveActiveTab();
    if (!ok) return;
    if (currentTabIndex < tabs.length - 1) {
      setActiveTab(tabs[currentTabIndex + 1].label);
    }
  };

  const handleBack = () => {
    if (currentTabIndex > 0) {
      setActiveTab(tabs[currentTabIndex - 1].label);
    }
  };

  return (
    <>
      {/* Profile Banner */}
      <motion.div
        className="px-10 mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="bg-white/[0.5] border border-white/[0.85] rounded-2xl px-6 py-4 backdrop-blur-[20px] shadow-[var(--shadow-sm)] flex items-center gap-5">
          <motion.div
            className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/15 to-secondary/15 border-2 border-primary/25 flex items-center justify-center shrink-0 overflow-hidden"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              duration: 0.6,
              delay: 0.2,
              type: "spring",
              stiffness: 200,
            }}
          >
            {bannerInfo.profilePicture ? (
              <img
                src={bannerInfo.profilePicture}
                alt={bannerInfo.fullName || "Profile"}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-7 h-7 text-primary/50" />
            )}
          </motion.div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <motion.h1
                className="text-lg font-bold text-foreground"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                {bannerInfo.fullName || "—"}
              </motion.h1>
              {bannerInfo.traineeCode && (
                <motion.span
                  className="px-2.5 py-0.5 rounded-full bg-secondary/10 text-secondary text-[11px] font-semibold"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.5 }}
                >
                  #{bannerInfo.traineeCode}
                </motion.span>
              )}
            </div>
            <motion.div
              className="flex items-center gap-5 mt-1 text-[12.5px] text-muted-foreground"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> {bannerInfo.mobile || "—"}
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> {bannerInfo.email || "—"}
              </span>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        className="px-10 mt-2"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25, ease: "easeOut" }}
      >
        <div className="flex gap-2 bg-white/[0.4] border border-white/[0.8] rounded-2xl p-2 backdrop-blur-[16px] shadow-[var(--shadow-sm)] overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {tabs.map((tab, index) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.label;
            return (
              <motion.button
                key={tab.label}
                type="button"
                onClick={() => setActiveTab(tab.label)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.35 + index * 0.06 }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium whitespace-nowrap transition-colors duration-300 ${
                  isActive
                    ? "text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/[0.6]"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeProfileTab"
                    className="absolute inset-0 bg-gradient-to-br from-primary to-primary-light rounded-xl shadow-[var(--shadow-primary)]"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Tab Content */}
      <div className="flex-1 px-10 py-6 pb-10">
        <FormProvider {...methods}>
          <div
              key={activeTab}
              className="bg-white/[0.6] border border-white/[0.88] rounded-2xl p-8 backdrop-blur-[20px] shadow-[var(--shadow-sm)]"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-foreground">
                  {activeTab}
                </h2>
              </div>

              {activeTab === "Personal Details" ? (
                <PersonalDetails
                  ref={personalRef}
                  existingPictureUrl={bannerInfo.profilePicture}
                  onSaved={fetchPersonalDetails}
                />
              ) : activeTab === "Location Details" ? (
                <LocationDetails
                  ref={locationRef}
                  onSaved={fetchPersonalDetails}
                />
              ) : activeTab === "Guardian Details" ? (
                <GuardianDetails ref={guardianRef} />
              ) : activeTab === "Education Details" ? (
                <EducationDetails ref={educationRef} />
              ) : activeTab === "Course Details" ? (
                <CourseDetails ref={courseRef} />
              ) : 
              activeTab === "Documents" ? (
                <Documents ref={documentsRef} />
              ) : 
              (
                ActiveComponent && <ActiveComponent />
              )}

              {/* Bottom Buttons */}
              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-foreground/[0.06]">
                {currentTabIndex > 0 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-8 py-2.5 bg-white/[0.65] border border-foreground/[0.12] text-foreground rounded-xl text-sm font-semibold hover:bg-white/[0.85] transition-all"
                  >
                    Back
                  </button>
                )}
                {currentTabIndex < tabs.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-8 py-2.5 bg-gradient-to-br from-primary to-primary-light text-primary-foreground rounded-xl text-sm font-bold shadow-[var(--shadow-primary)] hover:shadow-[0_12px_36px_hsl(342_80%_53%/0.5)] hover:-translate-y-0.5 transition-all duration-300"
                  >
                    Save & Next
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFinalSave}
                    className="px-8 py-2.5 bg-gradient-to-br from-primary to-primary-light text-primary-foreground rounded-xl text-sm font-bold shadow-[var(--shadow-primary)] hover:shadow-[0_12px_36px_hsl(342_80%_53%/0.5)] hover:-translate-y-0.5 transition-all duration-300"
                  >
                    Save
                  </button>
                )}
              </div>
            </div>
        </FormProvider>
      </div>

      {/* Footer */}
      <motion.div
        className="px-10 py-4 text-center text-xs text-muted-foreground border-t border-foreground/[0.06]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        © 2013 - {new Date().getFullYear()} XpertLab Technologies Private
        Limited
      </motion.div>
    </>
  );
};

export default MyProfile;
