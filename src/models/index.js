// src/models/index.js

import { User } from './User.js';
import { Business } from './Business.js';
import { Customer } from './Customer.js';
import { Template } from './Template.js';
import { Campaign } from './Campaign.js';
import { MessageLog } from './MessageLog.js';

import Employee from './Employee.js';
import { Department } from './Department.js';
import { Service } from './Service.js';
import { Designation } from './Designation.js';
import { LeaveType } from './LeaveType.js';
import { LeaveRequest } from './LeaveRequest.js';

import DocumentType from './DocumentType.js';
import EmailTemplate from './EmailTemplate.js';
import { Plan } from './Plan.js';
import { UserPlan } from './UserPlan.js';
import { Task } from './Task.js';
import { Note } from './Note.js';
import { LeadForm } from './LeadForm.js';
import { FormSubmission } from './FormSubmission.js';
import { UserSession } from './UserSession.js';
import { ActivityLog } from './ActivityLog.js';

// Billing models - define locally to avoid circular dependency
// The actual models are in src/billing/store/SequelizeStore.js
// We re-export them here for convenience
let PaymentLog, Invoice, WebhookLog, Subscription, RazorpayPlanMapping;
try {
  const billingModels = await import('../billing/store/SequelizeStore.js');
  PaymentLog = billingModels.PaymentLog;
  Invoice = billingModels.Invoice;
  WebhookLog = billingModels.WebhookLog;
  Subscription = billingModels.Subscription;
  RazorpayPlanMapping = billingModels.RazorpayPlanMapping;
} catch (e) {
  console.warn('Billing models not available:', e.message);
}

import EmployeeEducation from './EmployeeEducation.js';
import EmployeeExperience from './EmployeeExperience.js';
import EmployeeDocument from './EmployeeDocument.js';

/* =========================================================
   USER ↔ BUSINESS
   Business.ownerId → User.id
========================================================= */
User.hasMany(Business, { foreignKey: 'ownerId', as: 'businesses' });
Business.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

/* =========================================================
   USER ↔ CUSTOMER
========================================================= */
User.hasMany(Customer, { foreignKey: 'userId', as: 'customers' });
Customer.belongsTo(User, { foreignKey: 'userId', as: 'user' });

/* =========================================================
   BUSINESS ↔ CUSTOMER
========================================================= */
Business.hasMany(Customer, { foreignKey: 'businessId', as: 'customers' });
Customer.belongsTo(Business, { foreignKey: 'businessId', as: 'business' });

/* =========================================================
   USER ↔ TEMPLATE
========================================================= */
User.hasMany(Template, { foreignKey: 'userId', as: 'templates' });
Template.belongsTo(User, { foreignKey: 'userId', as: 'user' });

/* =========================================================
   USER ↔ CAMPAIGN
========================================================= */
User.hasMany(Campaign, { foreignKey: 'userId', as: 'campaigns' });
Campaign.belongsTo(User, { foreignKey: 'userId', as: 'user' });

/* =========================================================
   BUSINESS ↔ CAMPAIGN
========================================================= */
Business.hasMany(Campaign, { foreignKey: 'businessId', as: 'campaigns' });
Campaign.belongsTo(Business, { foreignKey: 'businessId', as: 'business' });

/* =========================================================
   TEMPLATE ↔ CAMPAIGN
========================================================= */
Template.hasMany(Campaign, { foreignKey: 'templateId', as: 'campaigns' });
Campaign.belongsTo(Template, { foreignKey: 'templateId', as: 'template' });

/* =========================================================
   EMAIL TEMPLATE ↔ CAMPAIGN
========================================================= */
EmailTemplate.hasMany(Campaign, { foreignKey: 'emailTemplateId', as: 'campaigns' });
Campaign.belongsTo(EmailTemplate, { foreignKey: 'emailTemplateId', as: 'emailTemplate' });

/* =========================================================
   MESSAGE LOG RELATIONS
========================================================= */
Campaign.hasMany(MessageLog, { foreignKey: 'campaignId', as: 'messageLogs' });
MessageLog.belongsTo(Campaign, { foreignKey: 'campaignId', as: 'campaign' });

Customer.hasMany(MessageLog, { foreignKey: 'customerId', as: 'messageLogs' });
MessageLog.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

Template.hasMany(MessageLog, { foreignKey: 'templateId', as: 'messageLogs' });
MessageLog.belongsTo(Template, { foreignKey: 'templateId', as: 'template' });

/* =========================================================
   BUSINESS ↔ HR STRUCTURE
========================================================= */
Business.hasMany(Department, {
  foreignKey: 'businessId',
  as: 'departments',
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE',
});
Department.belongsTo(Business, {
  foreignKey: 'businessId',
  as: 'business',
});

Business.hasMany(Service, { foreignKey: 'businessId', as: 'services' });
Service.belongsTo(Business, { foreignKey: 'businessId', as: 'business' });

Business.hasMany(Designation, { foreignKey: 'businessId', as: 'designations' });
Designation.belongsTo(Business, { foreignKey: 'businessId', as: 'business' });

/* =========================================================
   LEAVE MANAGEMENT
========================================================= */
Business.hasMany(LeaveType, { foreignKey: 'businessId', as: 'leaveTypes' });
LeaveType.belongsTo(Business, { foreignKey: 'businessId', as: 'business' });

Business.hasMany(LeaveRequest, { foreignKey: 'businessId', as: 'leaveRequests' });
LeaveRequest.belongsTo(Business, { foreignKey: 'businessId', as: 'business' });

Employee.hasMany(LeaveRequest, { foreignKey: 'employeeId', as: 'leaveRequests' });
LeaveRequest.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

LeaveType.hasMany(LeaveRequest, { foreignKey: 'leaveTypeId', as: 'requests' });
LeaveRequest.belongsTo(LeaveType, { foreignKey: 'leaveTypeId', as: 'leaveType' });

User.hasMany(LeaveRequest, { foreignKey: 'approverId', as: 'approvedLeaves' });
LeaveRequest.belongsTo(User, { foreignKey: 'approverId', as: 'approver' });

/* =========================================================
   EMPLOYEE SUB TABLES
========================================================= */
Employee.hasMany(EmployeeEducation, {
  foreignKey: 'employeeId',
  as: 'educations',
  onDelete: 'CASCADE',
  hooks: true,
});
EmployeeEducation.belongsTo(Employee, {
  foreignKey: 'employeeId',
  as: 'employee',
});

Employee.hasMany(EmployeeExperience, {
  foreignKey: 'employeeId',
  as: 'experiences',
  onDelete: 'CASCADE',
  hooks: true,
});
EmployeeExperience.belongsTo(Employee, {
  foreignKey: 'employeeId',
  as: 'employee',
});

Employee.hasMany(EmployeeDocument, {
  foreignKey: 'employeeId',
  as: 'documents',
  onDelete: 'CASCADE',
  hooks: true,
});
EmployeeDocument.belongsTo(Employee, {
  foreignKey: 'employeeId',
  as: 'employee',
});

/* =========================================================
   DOCUMENT TYPE ↔ EMAIL TEMPLATE
========================================================= */
DocumentType.hasMany(EmailTemplate, {
  foreignKey: 'documentTypeId',
  as: 'emailTemplates',
});
EmailTemplate.belongsTo(DocumentType, {
  foreignKey: 'documentTypeId',
  as: 'documentType',
});

/* =========================================================
   USER ↔ PLAN
========================================================= */
User.hasMany(UserPlan, { foreignKey: 'userId', as: 'userPlans' });
UserPlan.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Plan.hasMany(UserPlan, { foreignKey: 'planId', as: 'userPlans' });
UserPlan.belongsTo(Plan, { foreignKey: 'planId', as: 'plan' });

/* =========================================================
   USER ↔ TASK ↔ CUSTOMER
========================================================= */
User.hasMany(Task, { foreignKey: 'userId', as: 'tasks' });
Task.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Customer.hasMany(Task, { foreignKey: 'customerId', as: 'tasks' });
Task.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

/* =========================================================
   USER ↔ NOTE ↔ CUSTOMER (Notes & Timeline)
========================================================= */
User.hasMany(Note, { foreignKey: 'userId', as: 'notes' });
Note.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Customer.hasMany(Note, { foreignKey: 'customerId', as: 'notes' });
Note.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

User.hasMany(Note, { foreignKey: 'createdBy', as: 'createdNotes' });
Note.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

/* =========================================================
   USER ↔ LEAD FORM ↔ BUSINESS
========================================================= */
User.hasMany(LeadForm, { foreignKey: 'userId', as: 'leadForms' });
LeadForm.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Business.hasMany(LeadForm, { foreignKey: 'businessId', as: 'leadForms' });
LeadForm.belongsTo(Business, { foreignKey: 'businessId', as: 'business' });

/* =========================================================
   LEAD FORM ↔ FORM SUBMISSION ↔ CUSTOMER
========================================================= */
LeadForm.hasMany(FormSubmission, { foreignKey: 'formId', as: 'submissions' });
FormSubmission.belongsTo(LeadForm, { foreignKey: 'formId', as: 'form' });

Customer.hasMany(FormSubmission, { foreignKey: 'customerId', as: 'formSubmissions' });
FormSubmission.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

/* =========================================================
   USER ↔ USER SESSION ↔ ACTIVITY LOG
========================================================= */
User.hasMany(UserSession, { foreignKey: 'userId', as: 'sessions' });
UserSession.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(ActivityLog, { foreignKey: 'userId', as: 'activityLogs' });
ActivityLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

/* =========================================================
   BILLING: USER ↔ INVOICE, PAYMENT LOG, SUBSCRIPTION
   (Only set up if billing models are available)
========================================================= */
if (Invoice && PaymentLog && Subscription && RazorpayPlanMapping) {
  User.hasMany(Invoice, { foreignKey: 'userId', as: 'invoices' });
  Invoice.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  Plan.hasMany(Invoice, { foreignKey: 'planId', as: 'invoices' });
  Invoice.belongsTo(Plan, { foreignKey: 'planId', as: 'plan' });

  User.hasMany(PaymentLog, { foreignKey: 'userId', as: 'paymentLogs' });
  PaymentLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  User.hasMany(Subscription, { foreignKey: 'userId', as: 'subscriptions' });
  Subscription.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  Plan.hasMany(Subscription, { foreignKey: 'planId', as: 'subscriptions' });
  Subscription.belongsTo(Plan, { foreignKey: 'planId', as: 'plan' });

  Plan.hasOne(RazorpayPlanMapping, { foreignKey: 'planId', as: 'razorpayMapping' });
  RazorpayPlanMapping.belongsTo(Plan, { foreignKey: 'planId', as: 'plan' });
}

/* =========================================================
   EXPORT MODELS
========================================================= */
export {
  User,
  Business,
  Customer,
  Template,
  Campaign,
  MessageLog,

  Department,
  Service,
  Designation,
  LeaveType,
  LeaveRequest,

  Employee,
  EmployeeEducation,
  EmployeeExperience,
  EmployeeDocument,

  DocumentType,
  EmailTemplate,
  Plan,
  UserPlan,
  Task,
  Note,
  LeadForm,
  FormSubmission,
  UserSession,
  ActivityLog,
  
  // Billing models
  PaymentLog,
  Invoice,
  WebhookLog,
  Subscription,
  RazorpayPlanMapping,
};
