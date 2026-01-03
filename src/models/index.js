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
import { MenuItem } from './MenuItem.js';
import { PlanMenuItem } from './PlanMenuItem.js';
import { SocialAccount } from './SocialAccount.js';
import { SocialPost } from './SocialPost.js';
import { SocialPostChannel } from './SocialPostChannel.js';
import { SocialTemplate } from './SocialTemplate.js';
import { MediaAsset } from './MediaAsset.js';
import { PublishAttempt } from './PublishAttempt.js';
import { SocialAuditLog } from './SocialAuditLog.js';
import { LeadRecord } from './LeadRecord.js';
import { LeadTag } from './LeadTag.js';
import { LeadTagMap } from './LeadTagMap.js';
import { LeadNote } from './LeadNote.js';
import { LeadTask } from './LeadTask.js';
import { LeadAuditLog } from './LeadAuditLog.js';

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
   PLAN ↔ MENU ITEM (Plan-specific menu locks)
========================================================= */
Plan.hasMany(PlanMenuItem, { foreignKey: 'planId', as: 'planMenuItems' });
PlanMenuItem.belongsTo(Plan, { foreignKey: 'planId', as: 'plan' });

MenuItem.hasMany(PlanMenuItem, { foreignKey: 'menuItemId', as: 'planMenuItems' });
PlanMenuItem.belongsTo(MenuItem, { foreignKey: 'menuItemId', as: 'menuItem' });

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
   LEAD RECORDS ↔ FORM SUBMISSION ↔ USER ↔ BUSINESS ↔ CUSTOMER
========================================================= */
FormSubmission.hasOne(LeadRecord, { foreignKey: 'submissionId', as: 'leadRecord' });
LeadRecord.belongsTo(FormSubmission, { foreignKey: 'submissionId', as: 'submission' });

User.hasMany(LeadRecord, { foreignKey: 'userId', as: 'leadRecords' });
LeadRecord.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Business.hasMany(LeadRecord, { foreignKey: 'businessId', as: 'leadRecords' });
LeadRecord.belongsTo(Business, { foreignKey: 'businessId', as: 'business' });

Customer.hasMany(LeadRecord, { foreignKey: 'customerId', as: 'leadRecords' });
LeadRecord.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

User.hasMany(LeadRecord, { foreignKey: 'assignedTo', as: 'assignedLeads' });
LeadRecord.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignedUser' });

/* =========================================================
   LEAD RECORDS ↔ LEAD TAGS (Many-to-Many via lead_tag_map)
========================================================= */
LeadRecord.belongsToMany(LeadTag, {
  through: LeadTagMap,
  foreignKey: 'leadId',
  otherKey: 'tagId',
  as: 'tags'
});

LeadTag.belongsToMany(LeadRecord, {
  through: LeadTagMap,
  foreignKey: 'tagId',
  otherKey: 'leadId',
  as: 'leads'
});

LeadRecord.hasMany(LeadTagMap, { foreignKey: 'leadId', as: 'tagMappings' });
LeadTagMap.belongsTo(LeadRecord, { foreignKey: 'leadId', as: 'lead' });

LeadTag.hasMany(LeadTagMap, { foreignKey: 'tagId', as: 'leadMappings' });
LeadTagMap.belongsTo(LeadTag, { foreignKey: 'tagId', as: 'tag' });

User.hasMany(LeadTag, { foreignKey: 'userId', as: 'leadTags' });
LeadTag.belongsTo(User, { foreignKey: 'userId', as: 'user' });

/* =========================================================
   LEAD RECORDS ↔ LEAD NOTES
========================================================= */
LeadRecord.hasMany(LeadNote, { foreignKey: 'leadId', as: 'leadNotes' });
LeadNote.belongsTo(LeadRecord, { foreignKey: 'leadId', as: 'lead' });

User.hasMany(LeadNote, { foreignKey: 'userId', as: 'leadNotes' });
LeadNote.belongsTo(User, { foreignKey: 'userId', as: 'user' });

/* =========================================================
   LEAD RECORDS ↔ LEAD TASKS
========================================================= */
LeadRecord.hasMany(LeadTask, { foreignKey: 'leadId', as: 'tasks' });
LeadTask.belongsTo(LeadRecord, { foreignKey: 'leadId', as: 'lead' });

User.hasMany(LeadTask, { foreignKey: 'userId', as: 'leadTasks' });
LeadTask.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(LeadTask, { foreignKey: 'assignedTo', as: 'assignedLeadTasks' });
LeadTask.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignedUser' });

/* =========================================================
   LEAD RECORDS ↔ LEAD AUDIT LOGS
========================================================= */
LeadRecord.hasMany(LeadAuditLog, { foreignKey: 'leadId', as: 'auditLogs' });
LeadAuditLog.belongsTo(LeadRecord, { foreignKey: 'leadId', as: 'lead' });

User.hasMany(LeadAuditLog, { foreignKey: 'userId', as: 'leadAuditLogs' });
LeadAuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

/* =========================================================
   USER ↔ USER SESSION ↔ ACTIVITY LOG
========================================================= */
User.hasMany(UserSession, { foreignKey: 'userId', as: 'sessions' });
UserSession.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(ActivityLog, { foreignKey: 'userId', as: 'activityLogs' });
ActivityLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

/* =========================================================
   SOCIAL PUBLISHER RELATIONS
========================================================= */
User.hasMany(SocialAccount, { foreignKey: 'userId', as: 'socialAccounts' });
SocialAccount.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Business.hasMany(SocialAccount, { foreignKey: 'businessId', as: 'socialAccounts' });
SocialAccount.belongsTo(Business, { foreignKey: 'businessId', as: 'business' });

User.hasMany(SocialPost, { foreignKey: 'userId', as: 'socialPosts' });
SocialPost.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Business.hasMany(SocialPost, { foreignKey: 'businessId', as: 'socialPosts' });
SocialPost.belongsTo(Business, { foreignKey: 'businessId', as: 'business' });

SocialPost.hasMany(SocialPostChannel, { foreignKey: 'postId', as: 'channels' });
SocialPostChannel.belongsTo(SocialPost, { foreignKey: 'postId', as: 'post' });

SocialAccount.hasMany(SocialPostChannel, { foreignKey: 'accountId', as: 'postChannels' });
SocialPostChannel.belongsTo(SocialAccount, { foreignKey: 'accountId', as: 'account' });

SocialPostChannel.hasMany(PublishAttempt, { foreignKey: 'postChannelId', as: 'attempts' });
PublishAttempt.belongsTo(SocialPostChannel, { foreignKey: 'postChannelId', as: 'postChannel' });

User.hasMany(SocialTemplate, { foreignKey: 'userId', as: 'socialTemplates' });
SocialTemplate.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Business.hasMany(SocialTemplate, { foreignKey: 'businessId', as: 'socialTemplates' });
SocialTemplate.belongsTo(Business, { foreignKey: 'businessId', as: 'business' });

User.hasMany(MediaAsset, { foreignKey: 'userId', as: 'mediaAssets' });
MediaAsset.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Business.hasMany(MediaAsset, { foreignKey: 'businessId', as: 'mediaAssets' });
MediaAsset.belongsTo(Business, { foreignKey: 'businessId', as: 'business' });

User.hasMany(SocialAuditLog, { foreignKey: 'userId', as: 'socialAuditLogs' });
SocialAuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

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
  MenuItem,
  PlanMenuItem,
  
  // Social Publisher models
  SocialAccount,
  SocialPost,
  SocialPostChannel,
  SocialTemplate,
  MediaAsset,
  PublishAttempt,
  SocialAuditLog,
  
  // Lead Management models
  LeadRecord,
  LeadTag,
  LeadTagMap,
  LeadNote,
  LeadTask,
  LeadAuditLog,
  
  // Billing models
  PaymentLog,
  Invoice,
  WebhookLog,
  Subscription,
  RazorpayPlanMapping,
};
