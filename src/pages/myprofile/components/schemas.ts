import { z } from "zod";

const NAME_REGEX = /^[A-Za-z']+$/;
const USERNAME_REGEX = /^[A-Za-z0-9]+$/;
const EMAIL_REGEX =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

const isValidPhone = (v?: string | null) => {
  if (!v) return false;
  const digits = v.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
};

export const personalDetailsSchema = z
  .object({
    prefix: z.string().trim().min(1, "Please Select Prefix"),

    firstName: z
      .string()
      .trim()
      .min(1, "First Name Is Required")
      .max(30, "Please Enter Valid First Name")
      .regex(NAME_REGEX, "Please Enter Valid First Name"),

    middleName: z
      .string()
      .trim()
      .min(1, "Middle Name Is Required")
      .max(30, "Please Enter Valid Middle Name")
      .regex(NAME_REGEX, "Please Enter Valid Middle Name"),

    lastName: z
      .string()
      .trim()
      .min(1, "Last Name Is Required")
      .max(30, "Please Enter Valid Last Name")
      .regex(NAME_REGEX, "Please Enter Valid Last Name"),

    gender: z.string().trim().min(1, "Please Select Gender"),

    birthDate: z.date({
      required_error: "Birth Date Is Required",
      invalid_type_error: "Birth Date Is Required",
    }),

    email: z
      .string()
      .trim()
      .min(1, "Please Enter Primary Email")
      .max(60, "Please Enter Valid Primary Email")
      .regex(EMAIL_REGEX, "Please Enter Valid Email"),

    mobile1: z
      .string()
      .min(1, "Primary Mobile Number Is Required")
      .refine(isValidPhone, "Please Enter Valid Mobile Number"),

    mobile2: z
      .string()
      .nullable()
      .optional()
      .refine((v) => !v || isValidPhone(v), "Please Enter Valid Mobile Number"),

    userName: z
      .string()
      .trim()
      .min(1, "Username Is Required.")
      .max(40, "Please Enter Valid Username")
      .regex(USERNAME_REGEX, "Please Enter Valid Username"),

    password: z.string().trim().optional().default(""),

    confirmPassword: z.string().trim().optional().default(""),

    traineeId: z.string().optional().default(""),
  })
  .superRefine((d, ctx) => {
    const hasTraineeId = !!(d.traineeId && d.traineeId.trim() !== "");

    if (!hasTraineeId && (!d.password || d.password.trim() === "")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password"],
        message: "Please Enter Password",
      });
      return;
    }

    if (d.password && d.password.trim() !== "") {
      const pwd = d.password.trim();
      if (pwd.length < 6) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["password"],
          message: "Password must be at least 6 characters",
        });
      } else if (pwd.length > 20) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["password"],
          message: "Password cannot exceed 20 characters",
        });
      }

      if (!d.confirmPassword || d.confirmPassword.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["confirmPassword"],
          message: "Please Enter Confirm Password",
        });
      } else if (d.password !== d.confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["confirmPassword"],
          message: "Password and Confirm Password didn't match",
        });
      }
    }
  });

export type PersonalDetailsValues = z.infer<typeof personalDetailsSchema>;

export const guardianDetailsSchema = z.object({
  guardians: z
    .array(
      z.object({
        traineeguardiandetailId: z.string().optional().default(""),
        guardianType: z.string().trim().min(1, "Please Select Guardian Type"),
        relation: z.string().trim().min(1, "Please Select/Enter Relation"),
        firstName: z
          .string()
          .trim()
          .min(1, "First Name Is Required")
          .max(30, "Please Enter Valid Name")
          .regex(NAME_REGEX, "Please Enter Valid Name"),
        lastName: z
          .string()
          .trim()
          .min(1, "Last Name Is Required")
          .max(30, "Please Enter Valid Name")
          .regex(NAME_REGEX, "Please Enter Valid Name"),
        mobileNumber: z
          .string()
          .min(1, "Mobile Number Is Required")
          .refine(isValidPhone, "Please Enter Valid Mobile Number"),
        mobileNumber2: z
          .string()
          .optional()
          .default("")
          .refine((v) => !v || isValidPhone(v), "Please Enter Valid Mobile Number"),
      }),
    )
    .min(1, "At least one guardian is required"),
});

export type GuardianDetailsValues = z.infer<typeof guardianDetailsSchema>;

export const educationDetailsSchema = z
  .object({
    educations: z
      .array(
        z.object({
          traineeeducationdetailId: z.string().optional().default(""),
          educationType: z.string().trim(),
          education: z.string().trim().max(100, "Please Enter Valid Education").optional().default(""),
          boardId: z.string().trim(),
          instituteId: z.string().trim(),
          passingYear: z.string().optional().default(""),
          academicYear: z.string().optional().default(""),
          percentage: z.string().optional().default(""),
          isCompleted: z.string(),
          document: z.string().optional().default(""),
          url: z.string().optional().default(""),
        }),
      )
      .min(1),
  })
  .superRefine((d, ctx) => {
    d.educations.forEach((e, idx) => {
      const isCompleted = e.isCompleted === "1";
      const isSscOrHsc = e.educationType === "SSC" || e.educationType === "HSC";

      if (!e.educationType) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["educations", idx, "educationType"], message: "Education Type is required" });
      }
      if (!e.boardId) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["educations", idx, "boardId"], message: "Board is required" });
      }
      if (!e.instituteId) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["educations", idx, "instituteId"], message: "Institute is required" });
      }
      if (!isSscOrHsc && !e.education) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["educations", idx, "education"], message: "Education is required" });
      }
      if (isCompleted && !e.passingYear) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["educations", idx, "passingYear"], message: "Passing Year is required" });
      }
      if (!isCompleted && !e.academicYear) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["educations", idx, "academicYear"], message: "Academic Year is required" });
      }
      if (isCompleted) {
        if (!e.percentage) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["educations", idx, "percentage"], message: "Percentage is required" });
        } else if (!/^\d{1,3}(\.\d{1,2})?$/.test(e.percentage)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["educations", idx, "percentage"], message: "Please Enter Valid Percentage" });
        } else {
          const v = parseFloat(e.percentage);
          if (!(v > 0 && v <= 100)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["educations", idx, "percentage"], message: "Percentage must be between 1 and 100" });
          }
        }
        if (!e.document) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["educations", idx, "document"], message: "Document is required" });
        }
      }
    });
  });

export type EducationDetailsValues = z.infer<typeof educationDetailsSchema>;

export const locationDetailsSchema = z.object({
  stateId: z.string().trim().min(1, "Please Select State"),
  cityId: z.string().trim().min(1, "Please Select City"),
  address: z.string().trim().min(1, "Address Is Required"),
  permanentStateId: z.string().trim().min(1, "Please Select State"),
  permanentCityId: z.string().trim().min(1, "Please Select City"),
  permanentAddress: z.string().trim().min(1, "Address Is Required"),
});

export type LocationDetailsValues = z.infer<typeof locationDetailsSchema>;

export const courseDetailsSchema = z
  .object({
    enrollmentType: z.string().trim().min(1, "Please Select Enrollment Type"),
    course: z.string().trim().min(1, "Please Select Course"),
    traineeArea: z.string().trim().min(1, "Please Select Trainee Area"),
    batchDay: z.string().trim().min(1, "Please Select Batch Day"),
    batchTime: z.string().trim().min(1, "Please Select Batch Time"),
    joiningDate: z.date({
      required_error: "Joining Date Is Required",
      invalid_type_error: "Joining Date Is Required",
    }),
    hasLaptop: z
      .number({
        required_error: "Please Select Device Availability",
        invalid_type_error: "Please Select Device Availability",
      })
      .refine((v) => v === 0 || v === 1, "Please Select Device Availability"),
    computerId: z.string().optional().default(""),
  })
  .superRefine((d, ctx) => {
    if (d.hasLaptop === 0 && !d.computerId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["computerId"],
        message: "Please Select Computer",
      });
    }
  });

export type CourseDetailsValues = z.infer<typeof courseDetailsSchema>;

export const documentsSchema = z
  .object({
    aadharNumber: z
      .string()
      .trim()
      .min(1, "Aadhar Card Number Is Required")
      .regex(/^[0-9]{12}$/, "Please Enter Valid 12 Digit Aadhar Card Number"),
    documents: z
      .array(
        z.object({
          traineedocumentId: z.string(),
          name: z.string().optional().default(""),
          isCompulsory: z.union([z.boolean(), z.number()]).optional().default(0),
          document: z.string().optional().default(""),
          url: z.string().optional().default(""),
        }),
      )
      .default([]),
  })
  .superRefine((d, ctx) => {
    d.documents.forEach((doc, idx) => {
      const compulsory =
        doc.isCompulsory === true ||
        doc.isCompulsory === 1 ||
        String(doc.isCompulsory) === "1";
      if (compulsory && !doc.document) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["documents", idx, "document"],
          message: `${doc.name || "Document"} Is Required`,
        });
      }
    });
  });

export type DocumentsValues = z.infer<typeof documentsSchema>;

export const personalDetailsFieldNames = [
  "prefix",
  "firstName",
  "middleName",
  "lastName",
  "gender",
  "birthDate",
  "email",
  "mobile1",
  "mobile2",
  "userName",
  "password",
  "confirmPassword",
] as const;
