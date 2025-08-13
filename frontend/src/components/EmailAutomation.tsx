// import React, { useState, useEffect } from "react";
// import api from "../services/api";
// import { AxiosError } from "axios";

// interface EmailTemplate {
//   id: number;
//   name: string;
//   category: string;
//   subject: string;
//   body_html: string;
//   variables: string[];
//   usage_count: number;
//   is_system_template: boolean;
// }

// interface EmailSignature {
//   id: number;
//   name: string;
//   html_content: string;
//   company_logo_url: string;
//   company_name: string;
//   is_default: boolean;
// }

// interface EmailAddon {
//   id: number;
//   name: string;
//   type: string;
//   content: string;
//   auto_include: boolean;
// }

// interface EmailAutomationProps {
//   socket?: WebSocket | null;
//   sendMessage?: (message: string) => void;
//   isConnected?: boolean;
// }

// const EmailAutomation: React.FC<EmailAutomationProps> = ({
//   socket,
//   sendMessage,
//   isConnected,
// }) => {
//   const [activeTab, setActiveTab] = useState<
//     "compose" | "templates" | "signatures" | "addons" | "history"
//   >("compose");
//   const [templates, setTemplates] = useState<EmailTemplate[]>([]);
//   const [signatures, setSignatures] = useState<EmailSignature[]>([]);
//   const [addons, setAddons] = useState<EmailAddon[]>([]);
//   const [loading, setLoading] = useState(false);

//   const [composeForm, setComposeForm] = useState({
//     type: "single",
//     template_id: "",
//     recipient_email: "",
//     recipient_emails: "",
//     subject: "",
//     variables: {} as Record<string, string>,
//     send_immediately: true,
//     scheduled_at: "",
//   });

//   const [templateForm, setTemplateForm] = useState({
//     name: "",
//     category: "general",
//     subject: "",
//     body_html: "",
//     is_system_template: false,
//   });

//   const [signatureForm, setSignatureForm] = useState({
//     name: "",
//     html_content: "",
//     company_logo_url: "",
//     company_name: "NaviKenz",
//     is_default: false,
//   });

//   const [addonForm, setAddonForm] = useState({
//     name: "",
//     type: "policy",
//     content: "",
//     auto_include: false,
//   });

//   const getDefaultTemplates = () => [
//     {
//       name: "Offer Letter",
//       category: "offer_letter",
//       subject: "Job Offer - {{job_title}} Position at {{company_name}}",
//       body_html: `
//         <h2>Congratulations {{candidate_name}}!</h2>
//         <p>We are pleased to offer you the position of <strong>{{job_title}}</strong> at {{company_name}}.</p>
//         <h3>Offer Details:</h3>
//         <ul>
//           <li>Position: {{job_title}}</li>
//           <li>Department: {{department}}</li>
//           <li>Start Date: {{start_date}}</li>
//           <li>Salary: {{salary_amount}}</li>
//           <li>Location: {{work_location}}</li>
//         </ul>
//         <p>Please confirm your acceptance by replying to this email by {{response_deadline}}.</p>
//         <p>We look forward to welcoming you to our team!</p>
//       `,
//     },
//     {
//       name: "Interview Invitation",
//       category: "interview",
//       subject: "Interview Invitation - {{job_title}} Position",
//       body_html: `
//         <h2>Interview Invitation</h2>
//         <p>Dear {{candidate_name}},</p>
//         <p>Thank you for your interest in the <strong>{{job_title}}</strong> position at {{company_name}}.</p>
//         <h3>Interview Details:</h3>
//         <ul>
//           <li>Date: {{interview_date}}</li>
//           <li>Time: {{interview_time}}</li>
//           <li>Location: {{interview_location}}</li>
//           <li>Interviewer: {{interviewer_name}}</li>
//         </ul>
//         <p>Please confirm your availability by replying to this email.</p>
//         <p>Best regards,<br>{{company_name}} Team</p>
//       `,
//     },
//   ];

//   const useDefaultTemplate = (templateName: string) => {
//     const defaultTemplates = getDefaultTemplates();
//     const template = defaultTemplates.find((t) => t.name === templateName);

//     if (template) {
//       setTemplateForm({
//         name: template.name,
//         category: template.category,
//         subject: template.subject,
//         body_html: template.body_html,
//         is_system_template: false,
//       });
//     }
//   };

//   useEffect(() => {
//     loadTemplates();
//     loadSignatures();
//     loadAddons();
//   }, []);

//   const loadTemplates = async () => {
//     try {
//       console.log("Loading templates..."); // Debug log

//       const response = await api.get("/api/v1/emails/templates");

//       if (response.data.success) {
//         const loadedTemplates = response.data.templates || [];
//         setTemplates(loadedTemplates);
//         console.log("Templates loaded:", loadedTemplates.length); // Debug log
//       } else {
//         console.error("Failed to load templates:", response.data.error);
//         setTemplates([]);
//       }
//     } catch (error) {
//       console.error("Error loading templates:", error);
//       setTemplates([]);

//       const err = error as AxiosError;
//       if (err.response?.status === 404) {
//         console.warn("Templates endpoint not found - using fallback");
//       }
//     }
//   };

//   const loadSignatures = async () => {
//     try {
//       const response = await api.get("/api/v1/emails/signatures");
//       setSignatures(response.data.signatures || []);
//     } catch (error) {
//       console.error("Error loading signatures:", error);
//     }
//   };

//   const loadAddons = async () => {
//     try {
//       const response = await api.get("/api/v1/emails/addons");
//       setAddons(response.data.addons || []);
//     } catch (error) {
//       console.error("Error loading addons:", error);
//     }
//   };

//   const handleTemplateSelect = (templateId: string) => {
//     console.log("Template selected:", templateId); // Debug log

//     if (!templateId) {
//       // Reset form when no template selected
//       setComposeForm((prev) => ({
//         ...prev,
//         template_id: "",
//         subject: "",
//         variables: {},
//       }));
//       return;
//     }

//     const template = templates.find((t) => t.id.toString() === templateId);
//     console.log("Found template:", template); // Debug log

//     if (template) {
//       // Extract variables from template content
//       const extractedVariables = extractTemplateVariables(
//         template.body_html,
//         template.subject
//       );

//       // Update form state with proper batching
//       setComposeForm((prev) => ({
//         ...prev,
//         template_id: templateId,
//         subject: template.subject,
//         variables: extractedVariables.reduce((acc, variable) => {
//           acc[variable] = "";
//           return acc;
//         }, {} as Record<string, string>),
//       }));

//       console.log("Form updated with template:", templateId);
//     }
//   };

//   const extractTemplateVariables = (
//     bodyHtml: string,
//     subject: string
//   ): string[] => {
//     const combinedContent = `${bodyHtml} ${subject}`;
//     const variableRegex = /\{\{(\w+)\}\}/g;
//     const variables: string[] = [];
//     let match;

//     while ((match = variableRegex.exec(combinedContent)) !== null) {
//       if (!variables.includes(match[1])) {
//         variables.push(match[1]);
//       }
//     }

//     return variables;
//   };

//   const handleSendEmail = async () => {
//     if (!composeForm.template_id) {
//       alert("Please select a template");
//       return;
//     }

//     if (composeForm.type === "single" && !composeForm.recipient_email) {
//       alert("Please enter recipient email");
//       return;
//     }

//     if (composeForm.type === "bulk" && !composeForm.recipient_emails) {
//       alert("Please enter recipient emails");
//       return;
//     }

//     setLoading(true);
//     try {
//       let endpoint = "/api/v1/emails/send";
//       let payload: any = {
//         template_id: composeForm.template_id,
//         variables: composeForm.variables,
//         send_immediately: composeForm.send_immediately,
//         scheduled_at: composeForm.scheduled_at,
//       };

//       if (composeForm.type === "single") {
//         payload.recipient_email = composeForm.recipient_email;
//       } else {
//         endpoint = "/api/v1/emails/send-bulk";
//         payload.name = `Campaign ${new Date().toLocaleString()}`;
//         payload.recipient_type = composeForm.type;

//         if (composeForm.type === "bulk") {
//           payload.recipient_data = composeForm.recipient_emails
//             .split(",")
//             .map((email) => email.trim());
//         }
//       }

//       const response = await api.post(endpoint, payload);

//       if (response.data.success) {
//         alert(
//           composeForm.type === "single"
//             ? "Email sent successfully!"
//             : `Bulk email sent to ${response.data.sent_count} recipients`
//         );

//         setComposeForm({
//           type: "single",
//           template_id: "",
//           recipient_email: "",
//           recipient_emails: "",
//           subject: "",
//           variables: {},
//           send_immediately: true,
//           scheduled_at: "",
//         });

//         if (sendMessage && isConnected) {
//           sendMessage(
//             `Sent ${composeForm.type} email using template: ${
//               templates.find((t) => t.id.toString() === composeForm.template_id)
//                 ?.name
//             }`
//           );
//         }
//       }
//     } catch (error) {
//       console.error("Error sending email:", error);
//       alert("Failed to send email");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCreateTemplate = async () => {
//     if (
//       !templateForm.name ||
//       !templateForm.subject ||
//       !templateForm.body_html
//     ) {
//       alert("Please fill in all required fields");
//       return;
//     }

//     setLoading(true);
//     try {
//       // Extract variables before sending to backend
//       const extractedVariables = extractTemplateVariables(
//         templateForm.body_html,
//         templateForm.subject
//       );

//       const templateData = {
//         ...templateForm,
//         variables: extractedVariables,
//       };

//       console.log("Creating template with data:", templateData); // Debug log

//       const response = await api.post("/api/v1/emails/templates", templateData);

//       if (response.data.success) {
//         alert("Email template created successfully");

//         // Reset form
//         setTemplateForm({
//           name: "",
//           category: "general",
//           subject: "",
//           body_html: "",
//           is_system_template: false,
//         });

//         // Reload templates to include the new one
//         await loadTemplates();

//         console.log("Template created and templates reloaded"); // Debug log
//       } else {
//         throw new Error(response.data.error || "Failed to create template");
//       }
//     } catch (error) {
//       console.error("Error creating template:", error);
//       alert(`Failed to create template: ${error}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCreateSignature = async () => {
//     if (!signatureForm.name || !signatureForm.html_content) {
//       alert("Please fill in required fields");
//       return;
//     }

//     setLoading(true);
//     try {
//       const response = await api.post(
//         "/api/v1/emails/signatures",
//         signatureForm
//       );

//       if (response.data.success) {
//         alert("Email signature created successfully");
//         setSignatureForm({
//           name: "",
//           html_content: "",
//           company_logo_url: "",
//           company_name: "NaviKenz",
//           is_default: false,
//         });
//         loadSignatures();
//       }
//     } catch (error) {
//       console.error("Error creating signature:", error);
//       alert("Failed to create signature");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCreateAddon = async () => {
//     if (!addonForm.name || !addonForm.content) {
//       alert("Please fill in required fields");
//       return;
//     }

//     setLoading(true);
//     try {
//       const response = await api.post("/api/v1/emails/addons", addonForm);

//       if (response.data.success) {
//         alert("Email addon created successfully");
//         setAddonForm({
//           name: "",
//           type: "policy",
//           content: "",
//           auto_include: false,
//         });
//         loadAddons();
//       }
//     } catch (error) {
//       console.error("Error creating addon:", error);
//       alert("Failed to create addon");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="email-automation">
//       <div className="page-header">
//         <h1>📧 Email Automation</h1>
//         <p>
//           Streamline your recruitment communication with smart email templates
//           and bulk sending
//         </p>
//       </div>

//       {/* Tab Navigation */}
//       <div className="tab-navigation">
//         <button
//           className={`tab-button ${activeTab === "compose" ? "active" : ""}`}
//           onClick={() => setActiveTab("compose")}
//         >
//           ✉️ Compose Email
//         </button>
//         <button
//           className={`tab-button ${activeTab === "templates" ? "active" : ""}`}
//           onClick={() => setActiveTab("templates")}
//         >
//           📝 Templates
//         </button>
//         <button
//           className={`tab-button ${activeTab === "signatures" ? "active" : ""}`}
//           onClick={() => setActiveTab("signatures")}
//         >
//           ✍️ Signatures
//         </button>
//         <button
//           className={`tab-button ${activeTab === "addons" ? "active" : ""}`}
//           onClick={() => setActiveTab("addons")}
//         >
//           🔧 Add-ons
//         </button>
//         <button
//           className={`tab-button ${activeTab === "history" ? "active" : ""}`}
//           onClick={() => setActiveTab("history")}
//         >
//           📊 History
//         </button>
//       </div>

//       {/* ✅ FIXED: Compose Email Tab - Previously Missing */}
//       {activeTab === "compose" && (
//         <div className="tab-content">
//           <div className="compose-section">
//             <h3>📤 Send Email</h3>

//             {/* Email Type Selection */}
//             <div className="form-row">
//               <div className="form-group">
//                 <label>Email Type</label>
//                 <select
//                   value={composeForm.type}
//                   onChange={(e) =>
//                     setComposeForm({ ...composeForm, type: e.target.value })
//                   }
//                 >
//                   <option value="single">Single Recipient</option>
//                   <option value="bulk">Bulk Email</option>
//                   <option value="filtered">Filtered Recipients</option>
//                 </select>
//               </div>

//               <div className="form-group">
//                 <label>Template *</label>
//                 <select
//                   value={composeForm.template_id}
//                   onChange={(e) => {
//                     console.log("Template dropdown changed:", e.target.value); // Debug log
//                     handleTemplateSelect(e.target.value);
//                   }}
//                   className={`form-control ${
//                     !composeForm.template_id ? "placeholder-shown" : ""
//                   }`}
//                 >
//                   <option value="">Select a template</option>
//                   {templates.map((template) => (
//                     <option key={template.id} value={template.id.toString()}>
//                       {template.name} ({template.category})
//                     </option>
//                   ))}
//                 </select>

//                 {templates.length === 0 && (
//                   <small className="text-muted">
//                     No templates available. Create one in the Templates tab
//                     first.
//                   </small>
//                 )}

//                 {composeForm.template_id && (
//                   <small className="text-success">
//                     Template selected:{" "}
//                     {
//                       templates.find(
//                         (t) => t.id.toString() === composeForm.template_id
//                       )?.name
//                     }
//                   </small>
//                 )}
//               </div>
//             </div>

//             {/* Recipients */}
//             {composeForm.type === "single" && (
//               <div className="form-group">
//                 <label>Recipient Email *</label>
//                 <input
//                   type="email"
//                   placeholder="candidate@example.com"
//                   value={composeForm.recipient_email}
//                   onChange={(e) =>
//                     setComposeForm({
//                       ...composeForm,
//                       recipient_email: e.target.value,
//                     })
//                   }
//                 />
//               </div>
//             )}

//             {composeForm.type === "bulk" && (
//               <div className="form-group">
//                 <label>Recipient Emails *</label>
//                 <textarea
//                   placeholder="Enter emails separated by commas or new lines"
//                   value={composeForm.recipient_emails}
//                   onChange={(e) =>
//                     setComposeForm({
//                       ...composeForm,
//                       recipient_emails: e.target.value,
//                     })
//                   }
//                   rows={4}
//                 />
//                 <small>
//                   Separate multiple emails with commas or line breaks
//                 </small>
//               </div>
//             )}

//             {composeForm.template_id && (
//               <div className="template-preview-section">
//                 <h4>📋 Template Preview</h4>
//                 <div className="preview-card">
//                   <div className="preview-subject">
//                     <strong>Subject:</strong> {composeForm.subject}
//                   </div>
//                   <div className="preview-variables">
//                     <strong>Variables to fill:</strong>
//                     {Object.keys(composeForm.variables).length > 0 ? (
//                       <ul>
//                         {Object.keys(composeForm.variables).map((variable) => (
//                           <li key={variable}>
//                             {`{{${variable}}}`} -{" "}
//                             {composeForm.variables[variable] || "Not filled"}
//                           </li>
//                         ))}
//                       </ul>
//                     ) : (
//                       <span className="text-muted">
//                         No variables in this template
//                       </span>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             )}

//             {/* Template Variables */}
//             {Object.keys(composeForm.variables).length > 0 && (
//               <div className="variables-section">
//                 <h4>📝 Template Variables</h4>
//                 <div className="variables-grid">
//                   {Object.keys(composeForm.variables).map((variable) => (
//                     <div key={variable} className="form-group">
//                       <label>
//                         {variable
//                           .replace(/_/g, " ")
//                           .replace(/\b\w/g, (l) => l.toUpperCase())}
//                       </label>
//                       <input
//                         type="text"
//                         placeholder={`Enter ${variable}`}
//                         value={composeForm.variables[variable]}
//                         onChange={(e) =>
//                           setComposeForm({
//                             ...composeForm,
//                             variables: {
//                               ...composeForm.variables,
//                               [variable]: e.target.value,
//                             },
//                           })
//                         }
//                       />
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* Scheduling */}
//             <div className="form-row">
//               <div className="form-group">
//                 <label>
//                   <input
//                     type="checkbox"
//                     checked={composeForm.send_immediately}
//                     onChange={(e) =>
//                       setComposeForm({
//                         ...composeForm,
//                         send_immediately: e.target.checked,
//                       })
//                     }
//                   />
//                   Send Immediately
//                 </label>
//               </div>

//               {!composeForm.send_immediately && (
//                 <div className="form-group">
//                   <label>Schedule For</label>
//                   <input
//                     type="datetime-local"
//                     value={composeForm.scheduled_at}
//                     onChange={(e) =>
//                       setComposeForm({
//                         ...composeForm,
//                         scheduled_at: e.target.value,
//                       })
//                     }
//                     min={new Date().toISOString().slice(0, 16)}
//                   />
//                 </div>
//               )}
//             </div>

//             <button
//               className="btn-primary"
//               onClick={handleSendEmail}
//               disabled={loading}
//             >
//               {loading
//                 ? "Sending..."
//                 : composeForm.type === "single"
//                 ? "📤 Send Email"
//                 : "📤 Send Bulk Email"}
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Templates Tab */}
//       {activeTab === "templates" && (
//         <div className="tab-content">
//           {/* Quick Start Templates */}
//           <div className="quick-start-section">
//             <h3>🚀 Quick Start Templates</h3>
//             <p>Use these pre-built templates to get started quickly:</p>
//             <div className="default-templates-grid">
//               {getDefaultTemplates().map((template, index) => (
//                 <div key={index} className="default-template-card">
//                   <h4>{template.name}</h4>
//                   <span className="category-badge">{template.category}</span>
//                   <p>{template.subject}</p>
//                   <button
//                     className="btn-small"
//                     onClick={() => useDefaultTemplate(template.name)}
//                   >
//                     Use Template
//                   </button>
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* Template Creation Form */}
//           <div className="template-creation">
//             <h3>📝 Create Custom Template</h3>

//             <div className="form-grid">
//               <div className="form-group">
//                 <label>Template Name *</label>
//                 <input
//                   type="text"
//                   placeholder="e.g., Welcome Email"
//                   value={templateForm.name}
//                   onChange={(e) =>
//                     setTemplateForm({ ...templateForm, name: e.target.value })
//                   }
//                 />
//               </div>

//               <div className="form-group">
//                 <label>Category</label>
//                 <select
//                   value={templateForm.category}
//                   onChange={(e) =>
//                     setTemplateForm({
//                       ...templateForm,
//                       category: e.target.value,
//                     })
//                   }
//                 >
//                   <option value="general">General</option>
//                   <option value="onboarding">Onboarding</option>
//                   <option value="offer_letter">Offer Letter</option>
//                   <option value="interview">Interview</option>
//                   <option value="rejection">Rejection</option>
//                   <option value="follow_up">Follow Up</option>
//                 </select>
//               </div>

//               <div className="form-group full-width">
//                 <label>Subject Line *</label>
//                 <input
//                   type="text"
//                   placeholder="Welcome to {{company_name}} - {{candidate_name}}"
//                   value={templateForm.subject}
//                   onChange={(e) =>
//                     setTemplateForm({
//                       ...templateForm,
//                       subject: e.target.value,
//                     })
//                   }
//                 />
//                 <small>Use {`{{variable_name}}`} for dynamic content</small>
//               </div>

//               <div className="form-group full-width">
//                 <label>Email Body (HTML) *</label>
//                 <textarea
//                   placeholder="<h2>Welcome {{candidate_name}}!</h2><p>We're excited to have you join {{company_name}}...</p>"
//                   value={templateForm.body_html}
//                   onChange={(e) =>
//                     setTemplateForm({
//                       ...templateForm,
//                       body_html: e.target.value,
//                     })
//                   }
//                   rows={10}
//                 />
//                 <small>
//                   HTML formatting supported. Use {`{{variable_name}}`} for
//                   personalization
//                 </small>
//               </div>
//             </div>

//             <button
//               className="btn-primary"
//               onClick={handleCreateTemplate}
//               disabled={loading}
//             >
//               {loading ? "Creating..." : "📝 Create Template"}
//             </button>
//           </div>

//           {/* Existing Templates */}
//           <div className="existing-templates">
//             <h3>📋 Existing Templates</h3>
//             <div className="templates-grid">
//               {templates.map((template) => (
//                 <div key={template.id} className="template-card">
//                   <div className="template-header">
//                     <h4>{template.name}</h4>
//                     <span className={`category-badge ${template.category}`}>
//                       {template.category.replace("_", " ")}
//                     </span>
//                   </div>
//                   <p className="template-subject">{template.subject}</p>
//                   <div className="template-stats">
//                     <span>Used {template.usage_count} times</span>
//                     {template.is_system_template && (
//                       <span className="system-badge">System</span>
//                     )}
//                   </div>
//                   <div className="template-actions">
//                     <button className="btn-small">Edit</button>
//                     <button className="btn-small">Preview</button>
//                     <button className="btn-small">Duplicate</button>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ✅ FIXED: Signatures Tab - Previously Missing */}
//       {activeTab === "signatures" && (
//         <div className="tab-content">
//           <div className="signature-creation">
//             <h3>✍️ Create Email Signature</h3>

//             <div className="form-grid">
//               <div className="form-group">
//                 <label>Signature Name *</label>
//                 <input
//                   type="text"
//                   placeholder="e.g., HR Team Signature"
//                   value={signatureForm.name}
//                   onChange={(e) =>
//                     setSignatureForm({ ...signatureForm, name: e.target.value })
//                   }
//                 />
//               </div>

//               <div className="form-group">
//                 <label>Company Name</label>
//                 <input
//                   type="text"
//                   value={signatureForm.company_name}
//                   onChange={(e) =>
//                     setSignatureForm({
//                       ...signatureForm,
//                       company_name: e.target.value,
//                     })
//                   }
//                 />
//               </div>

//               <div className="form-group">
//                 <label>Company Logo URL</label>
//                 <input
//                   type="url"
//                   placeholder="https://company.com/logo.png"
//                   value={signatureForm.company_logo_url}
//                   onChange={(e) =>
//                     setSignatureForm({
//                       ...signatureForm,
//                       company_logo_url: e.target.value,
//                     })
//                   }
//                 />
//               </div>

//               <div className="form-group">
//                 <label>
//                   <input
//                     type="checkbox"
//                     checked={signatureForm.is_default}
//                     onChange={(e) =>
//                       setSignatureForm({
//                         ...signatureForm,
//                         is_default: e.target.checked,
//                       })
//                     }
//                   />
//                   Set as Default Signature
//                 </label>
//               </div>

//               <div className="form-group full-width">
//                 <label>Signature HTML *</label>
//                 <textarea
//                   placeholder="<p>Best regards,<br><strong>HR Team</strong><br>NaviKenz<br>Email: hr@navikenz.com</p>"
//                   value={signatureForm.html_content}
//                   onChange={(e) =>
//                     setSignatureForm({
//                       ...signatureForm,
//                       html_content: e.target.value,
//                     })
//                   }
//                   rows={6}
//                 />
//               </div>
//             </div>

//             <button
//               className="btn-primary"
//               onClick={handleCreateSignature}
//               disabled={loading}
//             >
//               {loading ? "Creating..." : "✍️ Create Signature"}
//             </button>
//           </div>

//           {/* Existing Signatures */}
//           <div className="existing-signatures">
//             <h3>📝 Existing Signatures</h3>
//             <div className="signatures-list">
//               {signatures.map((signature) => (
//                 <div key={signature.id} className="signature-card">
//                   <div className="signature-info">
//                     <h4>{signature.name}</h4>
//                     {signature.is_default && (
//                       <span className="default-badge">Default</span>
//                     )}
//                   </div>
//                   <div
//                     className="signature-preview"
//                     dangerouslySetInnerHTML={{ __html: signature.html_content }}
//                   />
//                   <div className="signature-actions">
//                     <button className="btn-small">Edit</button>
//                     <button className="btn-small">Set Default</button>
//                     <button className="btn-small">Delete</button>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ✅ FIXED: Add-ons Tab - Previously Missing */}
//       {activeTab === "addons" && (
//         <div className="tab-content">
//           <div className="addon-creation">
//             <h3>🔧 Create Email Add-on</h3>

//             <div className="form-grid">
//               <div className="form-group">
//                 <label>Add-on Name *</label>
//                 <input
//                   type="text"
//                   placeholder="e.g., Company Policy"
//                   value={addonForm.name}
//                   onChange={(e) =>
//                     setAddonForm({ ...addonForm, name: e.target.value })
//                   }
//                 />
//               </div>

//               <div className="form-group">
//                 <label>Type</label>
//                 <select
//                   value={addonForm.type}
//                   onChange={(e) =>
//                     setAddonForm({ ...addonForm, type: e.target.value })
//                   }
//                 >
//                   <option value="policy">Company Policy</option>
//                   <option value="terms">Terms & Conditions</option>
//                   <option value="disclaimer">Disclaimer</option>
//                   <option value="social_links">Social Links</option>
//                   <option value="contact_info">Contact Information</option>
//                 </select>
//               </div>

//               <div className="form-group">
//                 <label>
//                   <input
//                     type="checkbox"
//                     checked={addonForm.auto_include}
//                     onChange={(e) =>
//                       setAddonForm({
//                         ...addonForm,
//                         auto_include: e.target.checked,
//                       })
//                     }
//                   />
//                   Auto-include in all emails
//                 </label>
//               </div>

//               <div className="form-group full-width">
//                 <label>Content *</label>
//                 <textarea
//                   placeholder="This email is confidential and intended only for the recipient..."
//                   value={addonForm.content}
//                   onChange={(e) =>
//                     setAddonForm({ ...addonForm, content: e.target.value })
//                   }
//                   rows={6}
//                 />
//               </div>
//             </div>

//             <button
//               className="btn-primary"
//               onClick={handleCreateAddon}
//               disabled={loading}
//             >
//               {loading ? "Creating..." : "🔧 Create Add-on"}
//             </button>
//           </div>

//           {/* Existing Add-ons */}
//           <div className="existing-addons">
//             <h3>🔧 Existing Add-ons</h3>
//             <div className="addons-list">
//               {addons.map((addon) => (
//                 <div key={addon.id} className="addon-card">
//                   <div className="addon-header">
//                     <h4>{addon.name}</h4>
//                     <span className={`type-badge ${addon.type}`}>
//                       {addon.type.replace("_", " ")}
//                     </span>
//                     {addon.auto_include && (
//                       <span className="auto-badge">Auto-include</span>
//                     )}
//                   </div>
//                   <p className="addon-content">
//                     {addon.content.substring(0, 100)}...
//                   </p>
//                   <div className="addon-actions">
//                     <button className="btn-small">Edit</button>
//                     <button className="btn-small">Toggle Auto</button>
//                     <button className="btn-small">Delete</button>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ✅ FIXED: History Tab - Previously Missing */}
//       {activeTab === "history" && (
//         <div className="tab-content">
//           <div className="email-history">
//             <h3>📊 Email Campaign History</h3>
//             <div className="history-stats">
//               <div className="stat-card">
//                 <h4>Total Campaigns</h4>
//                 <span className="stat-number">24</span>
//               </div>
//               <div className="stat-card">
//                 <h4>Emails Sent</h4>
//                 <span className="stat-number">1,247</span>
//               </div>
//               <div className="stat-card">
//                 <h4>Success Rate</h4>
//                 <span className="stat-number">98.5%</span>
//               </div>
//               <div className="stat-card">
//                 <h4>Open Rate</h4>
//                 <span className="stat-number">67.2%</span>
//               </div>
//             </div>

//             <div className="history-table">
//               <table>
//                 <thead>
//                   <tr>
//                     <th>Campaign</th>
//                     <th>Template</th>
//                     <th>Recipients</th>
//                     <th>Sent</th>
//                     <th>Failed</th>
//                     <th>Date</th>
//                     <th>Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   <tr>
//                     <td>Welcome Campaign</td>
//                     <td>Onboarding Welcome</td>
//                     <td>45</td>
//                     <td>44</td>
//                     <td>1</td>
//                     <td>2025-06-15</td>
//                     <td>
//                       <button className="btn-small">View</button>
//                       <button className="btn-small">Resend</button>
//                     </td>
//                   </tr>
//                   <tr>
//                     <td>Interview Invitations</td>
//                     <td>Interview Invitation</td>
//                     <td>12</td>
//                     <td>12</td>
//                     <td>0</td>
//                     <td>2025-06-14</td>
//                     <td>
//                       <button className="btn-small">View</button>
//                       <button className="btn-small">Resend</button>
//                     </td>
//                   </tr>
//                   <tr>
//                     <td>Offer Letters</td>
//                     <td>Offer Letter</td>
//                     <td>3</td>
//                     <td>3</td>
//                     <td>0</td>
//                     <td>2025-06-13</td>
//                     <td>
//                       <button className="btn-small">View</button>
//                       <button className="btn-small">Resend</button>
//                     </td>
//                   </tr>
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Enhanced CSS Styles */}
//     </div>
//   );
// };

// export default EmailAutomation;

import React, { useState, useEffect } from 'react';
import {
  Card, Table, Tag, Space, Button, Input, Select, Statistic, Row, Col, Modal, Drawer,
  Badge, Divider, Alert, message, Spin, Progress, Tooltip, Typography, Tabs, Switch,
  Form, DatePicker, TimePicker, Upload, Avatar, List, Empty, Popconfirm
} from 'antd';
import {
  MailOutlined, SendOutlined, FileTextOutlined, UserOutlined, SettingOutlined,
  PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, CopyOutlined,
  UploadOutlined, DownloadOutlined, ClockCircleOutlined, CheckCircleOutlined,
  ExclamationCircleOutlined, GlobalOutlined, TeamOutlined, BarChartOutlined,
  ThunderboltOutlined, BulbOutlined, SafetyCertificateOutlined, CalendarOutlined,
  FilterOutlined, SearchOutlined, ReloadOutlined, ShareAltOutlined
} from '@ant-design/icons';
import moment from 'moment';
import api from '../services/api';

const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;
const { Text, Title, Paragraph } = Typography;
const { RangePicker } = DatePicker;

interface EmailAutomationProps {
  socket?: WebSocket | null;
  sendMessage?: (message: string) => void;
  isConnected?: boolean;
}

interface EmailTemplate {
  id: number;
  name: string;
  category: string;
  subject: string;
  body_html: string;
  variables: string[];
  usage_count: number;
  is_system_template: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

interface EmailSignature {
  id: number;
  name: string;
  html_content: string;
  company_logo_url?: string;
  company_name: string;
  is_default: boolean;
  created_at: string;
}

interface EmailCampaign {
  id: number;
  name: string;
  template_id: number;
  template_name: string;
  recipient_count: number;
  sent_count: number;
  failed_count: number;
  status: 'draft' | 'sending' | 'completed' | 'failed';
  scheduled_at?: string;
  created_at: string;
  completed_at?: string;
  open_rate?: number;
  click_rate?: number;
}

interface EmailStats {
  total_campaigns: number;
  total_emails_sent: number;
  success_rate: number;
  avg_open_rate: number;
  campaigns_this_month: number;
  emails_this_week: number;
}

const EmailAutomation: React.FC<EmailAutomationProps> = ({
  socket,
  sendMessage,
  isConnected,
}) => {
  // State Management
  const [activeTab, setActiveTab] = useState('compose');
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [signatures, setSignatures] = useState<EmailSignature[]>([]);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [stats, setStats] = useState<EmailStats>({
    total_campaigns: 0,
    total_emails_sent: 0,
    success_rate: 0,
    avg_open_rate: 0,
    campaigns_this_month: 0,
    emails_this_week: 0
  });

  // Form States
  const [composeForm, setComposeForm] = useState({
    type: 'single',
    template_id: '',
    recipient_email: '',
    recipient_emails: '',
    candidate_ids: '',
    subject: '',
    variables: {} as Record<string, string>,
    signature_id: '',
    send_immediately: true,
    scheduled_at: null as moment.Moment | null,
    priority: 'normal'
  });

  const [templateForm, setTemplateForm] = useState({
    name: '',
    category: 'general',
    subject: '',
    body_html: '',
    is_system_template: false
  });

  const [signatureForm, setSignatureForm] = useState({
    name: '',
    html_content: '',
    company_logo_url: '',
    company_name: 'Navikenz India Pvt Ltd',
    is_default: false
  });

  // UI States
  const [templateDrawerVisible, setTemplateDrawerVisible] = useState(false);
  const [signatureDrawerVisible, setSignatureDrawerVisible] = useState(false);
  const [campaignDrawerVisible, setCampaignDrawerVisible] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [selectedCampaign, setCampaignDetail] = useState<EmailCampaign | null>(null);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewContent, setPreviewContent] = useState('');

  // Load initial data
  useEffect(() => {
    loadTemplates();
    loadSignatures();
    loadCampaigns();
    loadStats();
  }, []);

  // API Functions
  const loadTemplates = async () => {
    try {
      console.log('📧 Loading email templates...');
      const response = await api.get('/api/v1/emails/templates');

      if (response.data.success) {
        setTemplates(response.data.templates || []);
        console.log(`✅ Loaded ${response.data.templates?.length || 0} templates`);
      } else {
        setTemplates([]);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
      setTemplates([]);
    }
  };

  const loadSignatures = async () => {
    try {
      const response = await api.get('/api/v1/emails/signatures');
      setSignatures(response.data.signatures || []);
    } catch (error) {
      console.error('Failed to load signatures:', error);
      setSignatures([]);
    }
  };

  const loadCampaigns = async () => {
    try {
      const response = await api.get('/api/v1/emails/campaigns');
      setCampaigns(response.data.campaigns || []);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
      setCampaigns([]);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/api/v1/emails/stats');
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Failed to load email stats:', error);
    }
  };

  // Email Sending Functions
  const handleTemplateSelect = (templateId: string) => {
    if (!templateId) {
      setComposeForm(prev => ({
        ...prev,
        template_id: '',
        subject: '',
        variables: {}
      }));
      return;
    }

    const template = templates.find(t => t.id.toString() === templateId);
    if (template) {
      const extractedVariables = extractTemplateVariables(template.body_html, template.subject);

      setComposeForm(prev => ({
        ...prev,
        template_id: templateId,
        subject: template.subject,
        variables: extractedVariables.reduce((acc, variable) => {
          acc[variable] = '';
          return acc;
        }, {} as Record<string, string>)
      }));
    }
  };

  const extractTemplateVariables = (bodyHtml: string, subject: string): string[] => {
    const combinedContent = `${bodyHtml} ${subject}`;
    const variableRegex = /\{\{(\w+)\}\}/g;
    const variables: string[] = [];
    let match;

    while ((match = variableRegex.exec(combinedContent)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }

    return variables;
  };

  const handleSendEmail = async () => {
    if (!composeForm.template_id) {
      message.error('Please select a template');
      return;
    }

    if (composeForm.type === 'single' && !composeForm.recipient_email) {
      message.error('Please enter recipient email');
      return;
    }

    if (composeForm.type === 'bulk' && !composeForm.recipient_emails && !composeForm.candidate_ids) {
      message.error('Please enter recipients');
      return;
    }

    // Validate variables
    const requiredVariables = Object.keys(composeForm.variables);
    const missingVariables = requiredVariables.filter(variable => !composeForm.variables[variable]);

    if (missingVariables.length > 0) {
      message.error(`Please fill in all variables: ${missingVariables.join(', ')}`);
      return;
    }

    setLoading(true);
    try {
      let endpoint = '/api/v1/emails/send';
      let payload: any = {
        template_id: composeForm.template_id,
        variables: composeForm.variables,
        signature_id: composeForm.signature_id || null,
        send_immediately: composeForm.send_immediately,
        scheduled_at: composeForm.scheduled_at ? composeForm.scheduled_at.toISOString() : null,
        priority: composeForm.priority
      };

      if (composeForm.type === 'single') {
        payload.recipient_email = composeForm.recipient_email;
      } else {
        endpoint = '/api/v1/emails/send-bulk';
        payload.campaign_name = `Campaign ${moment().format('YYYY-MM-DD HH:mm')}`;
        payload.recipient_type = composeForm.type;

        if (composeForm.type === 'bulk') {
          if (composeForm.recipient_emails) {
            payload.recipient_emails = composeForm.recipient_emails
              .split(/[,\n]/)
              .map(email => email.trim())
              .filter(email => email);
          }
          if (composeForm.candidate_ids) {
            payload.candidate_ids = composeForm.candidate_ids
              .split(',')
              .map(id => parseInt(id.trim()))
              .filter(id => !isNaN(id));
          }
        } else if (composeForm.type === 'candidates') {
          payload.filter_criteria = {
            status: 'shortlisted',
            is_available: true
          };
        }
      }

      console.log('📤 Sending email with payload:', payload);

      const response = await api.post(endpoint, payload);

      if (response.data.success) {
        message.success(
          composeForm.type === 'single'
            ? 'Email sent successfully!'
            : `Bulk email campaign created. ${response.data.sent_count || 0} emails ${composeForm.send_immediately ? 'sent' : 'scheduled'}.`
        );

        // Reset form
        setComposeForm({
          type: 'single',
          template_id: '',
          recipient_email: '',
          recipient_emails: '',
          candidate_ids: '',
          subject: '',
          variables: {},
          signature_id: '',
          send_immediately: true,
          scheduled_at: null,
          priority: 'normal'
        });

        // Refresh campaigns and stats
        await loadCampaigns();
        await loadStats();

        if (sendMessage && isConnected) {
          sendMessage(
            `Sent ${composeForm.type} email using template: ${templates.find(t => t.id.toString() === composeForm.template_id)?.name
            }`
          );
        }
      } else {
        throw new Error(response.data.error || 'Failed to send email');
      }
    } catch (error: any) {
      console.error('❌ Email sending error:', error);
      message.error(`Failed to send email: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Template Management
  const handleCreateTemplate = async () => {
    if (!templateForm.name || !templateForm.subject || !templateForm.body_html) {
      message.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const extractedVariables = extractTemplateVariables(templateForm.body_html, templateForm.subject);

      const templateData = {
        ...templateForm,
        variables: extractedVariables
      };

      const response = await api.post('/api/v1/emails/templates', templateData);

      if (response.data.success) {
        message.success('Email template created successfully');
        setTemplateForm({
          name: '',
          category: 'general',
          subject: '',
          body_html: '',
          is_system_template: false
        });
        setTemplateDrawerVisible(false);
        await loadTemplates();
      } else {
        throw new Error(response.data.error || 'Failed to create template');
      }
    } catch (error: any) {
      console.error('Template creation error:', error);
      message.error(`Failed to create template: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSignature = async () => {
    if (!signatureForm.name || !signatureForm.html_content) {
      message.error('Please fill in required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/v1/emails/signatures', signatureForm);

      if (response.data.success) {
        message.success('Email signature created successfully');
        setSignatureForm({
          name: '',
          html_content: '',
          company_logo_url: '',
          company_name: 'Navikenz India Pvt Ltd',
          is_default: false
        });
        setSignatureDrawerVisible(false);
        await loadSignatures();
      } else {
        throw new Error(response.data.error || 'Failed to create signature');
      }
    } catch (error: any) {
      console.error('Signature creation error:', error);
      message.error(`Failed to create signature: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Preview Functions
  const previewTemplate = (template: EmailTemplate) => {
    let content = template.body_html;

    // Replace variables with sample data
    const sampleData: Record<string, string> = {
      candidate_name: 'John Doe',
      company_name: 'Navikenz India Pvt Ltd',
      job_title: 'Senior Software Engineer',
      department: 'Engineering',
      start_date: '2025-02-01',
      salary_amount: '₹15,00,000',
      work_location: 'Bangalore',
      interview_date: '2025-01-20',
      interview_time: '10:00 AM',
      interviewer_name: 'Jane Smith'
    };

    template.variables.forEach(variable => {
      const value = sampleData[variable] || `[${variable}]`;
      content = content.replace(new RegExp(`\\{\\{${variable}\\}\\}`, 'g'), value);
    });

    setPreviewContent(content);
    setPreviewModalVisible(true);
  };

  // Default templates
  const getDefaultTemplates = () => [
    {
      name: 'Interview Invitation',
      category: 'interview',
      subject: 'Interview Invitation - {{job_title}} Position at {{company_name}}',
      body_html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1890ff;">Interview Invitation</h2>
          <p>Dear {{candidate_name}},</p>
          <p>Thank you for your interest in the <strong>{{job_title}}</strong> position at {{company_name}}.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Interview Details:</h3>
            <ul style="list-style: none; padding: 0;">
              <li><strong>📅 Date:</strong> {{interview_date}}</li>
              <li><strong>🕐 Time:</strong> {{interview_time}}</li>
              <li><strong>📍 Location:</strong> {{interview_location}}</li>
              <li><strong>👤 Interviewer:</strong> {{interviewer_name}}</li>
            </ul>
          </div>
          
          <p>Please confirm your availability by replying to this email.</p>
          <p>Best regards,<br>{{company_name}} Team</p>
        </div>
      `
    },
    {
      name: 'Offer Letter',
      category: 'offer_letter',
      subject: 'Job Offer - {{job_title}} Position at {{company_name}}',
      body_html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #52c41a;">Congratulations {{candidate_name}}!</h2>
          <p>We are pleased to offer you the position of <strong>{{job_title}}</strong> at {{company_name}}.</p>
          
          <div style="background-color: #f6ffed; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #52c41a;">
            <h3 style="margin-top: 0; color: #52c41a;">Offer Details:</h3>
            <ul>
              <li><strong>Position:</strong> {{job_title}}</li>
              <li><strong>Department:</strong> {{department}}</li>
              <li><strong>Start Date:</strong> {{start_date}}</li>
              <li><strong>Salary:</strong> {{salary_amount}}</li>
              <li><strong>Location:</strong> {{work_location}}</li>
            </ul>
          </div>
          
          <p>Please confirm your acceptance by replying to this email by {{response_deadline}}.</p>
          <p>We look forward to welcoming you to our team!</p>
        </div>
      `
    },
    {
      name: 'Application Acknowledgment',
      category: 'acknowledgment',
      subject: 'Application Received - {{job_title}} Position',
      body_html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1890ff;">Thank You for Your Application</h2>
          <p>Dear {{candidate_name}},</p>
          <p>Thank you for applying for the <strong>{{job_title}}</strong> position at {{company_name}}.</p>
          
          <div style="background-color: #e6f7ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>What happens next?</strong></p>
            <ul>
              <li>Our recruitment team will review your application</li>
              <li>If your profile matches our requirements, we'll contact you within 5-7 business days</li>
              <li>You can check your application status on our careers portal</li>
            </ul>
          </div>
          
          <p>We appreciate your interest in joining our team and look forward to potentially working with you.</p>
          <p>Best regards,<br>{{company_name}} Recruitment Team</p>
        </div>
      `
    }
  ];

  const useDefaultTemplate = (template: any) => {
    setTemplateForm({
      name: template.name,
      category: template.category,
      subject: template.subject,
      body_html: template.body_html,
      is_system_template: false
    });
  };

  // Delete functions
  const deleteTemplate = async (id: number) => {
    try {
      await api.delete(`/api/v1/emails/templates/${id}`);
      message.success('Template deleted successfully');
      await loadTemplates();
    } catch (error) {
      message.error('Failed to delete template');
    }
  };

  const deleteSignature = async (id: number) => {
    try {
      await api.delete(`/api/v1/emails/signatures/${id}`);
      message.success('Signature deleted successfully');
      await loadSignatures();
    } catch (error) {
      message.error('Failed to delete signature');
    }
  };

  // Table columns
  const templateColumns = [
    {
      title: 'Template',
      key: 'template',
      render: (record: EmailTemplate) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.subject}
          </div>
        </div>
      )
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => (
        <Tag color="blue">{category.replace('_', ' ')}</Tag>
      )
    },
    {
      title: 'Variables',
      dataIndex: 'variables',
      key: 'variables',
      render: (variables: string[]) => (
        <div>
          {variables.length > 0 ? (
            <Space wrap>
              {variables.slice(0, 3).map(variable => (
                <Tag key={variable}>{variable}</Tag>
              ))}
              {variables.length > 3 && (
                <Text type="secondary">+{variables.length - 3} more</Text>
              )}
            </Space>
          ) : (
            <Text type="secondary">No variables</Text>
          )}
        </div>
      )
    },
    {
      title: 'Usage',
      dataIndex: 'usage_count',
      key: 'usage_count',
      render: (count: number) => (
        <Badge count={count} style={{ backgroundColor: '#52c41a' }} />
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: EmailTemplate) => (
        <Space>
          <Tooltip title="Preview">
            <Button
              icon={<EyeOutlined />}
              size="small"
              onClick={() => previewTemplate(record)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => {
                setSelectedTemplate(record);
                setTemplateForm({
                  name: record.name,
                  category: record.category,
                  subject: record.subject,
                  body_html: record.body_html,
                  is_system_template: record.is_system_template
                });
                setTemplateDrawerVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Copy">
            <Button
              icon={<CopyOutlined />}
              size="small"
              onClick={() => {
                navigator.clipboard.writeText(record.body_html);
                message.success('Template copied to clipboard');
              }}
            />
          </Tooltip>
          <Popconfirm
            title="Delete template?"
            description="This action cannot be undone."
            onConfirm={() => deleteTemplate(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              icon={<DeleteOutlined />}
              size="small"
              danger
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const campaignColumns = [
    {
      title: 'Campaign',
      key: 'campaign',
      render: (record: EmailCampaign) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            Template: {record.template_name}
          </div>
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = {
          draft: 'default',
          sending: 'processing',
          completed: 'success',
          failed: 'error'
        };
        return <Tag color={colors[status as keyof typeof colors]}>{status.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Recipients',
      key: 'recipients',
      render: (record: EmailCampaign) => (
        <div>
          <div>Total: {record.recipient_count}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            Sent: {record.sent_count} | Failed: {record.failed_count}
          </div>
        </div>
      )
    },
    {
      title: 'Performance',
      key: 'performance',
      render: (record: EmailCampaign) => (
        <div>
          {record.open_rate !== undefined && (
            <div>Open Rate: {record.open_rate}%</div>
          )}
          {record.click_rate !== undefined && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              Click Rate: {record.click_rate}%
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Date',
      key: 'date',
      render: (record: EmailCampaign) => (
        <div>
          <div>{moment(record.created_at).format('MMM DD, YYYY')}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {moment(record.created_at).format('HH:mm')}
          </div>
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: EmailCampaign) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => {
              setCampaignDetail(record);
              setCampaignDrawerVisible(true);
            }}
          />
          <Button
            icon={<DownloadOutlined />}
            size="small"
            onClick={() => {
              // Export campaign data
              const dataStr = JSON.stringify(record, null, 2);
              const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
              const exportFileDefaultName = `campaign_${record.id}_${moment(record.created_at).format('YYYY-MM-DD')}.json`;
              const linkElement = document.createElement('a');
              linkElement.setAttribute('href', dataUri);
              linkElement.setAttribute('download', exportFileDefaultName);
              linkElement.click();
            }}
          />
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <Title level={2}>
          <MailOutlined style={{ marginRight: 12, color: '#1890ff' }} />
          Email Automation
        </Title>
        <Paragraph>
          Advanced email automation system with templates, bulk sending, and analytics
        </Paragraph>
      </div>

      {/* Stats Dashboard */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8} md={6} lg={4}>
          <Card size="small">
            <Statistic
              title="Total Campaigns"
              value={stats.total_campaigns}
              prefix={<SendOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6} lg={4}>
          <Card size="small">
            <Statistic
              title="Emails Sent"
              value={stats.total_emails_sent}
              prefix={<MailOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6} lg={4}>
          <Card size="small">
            <Statistic
              title="Success Rate"
              value={stats.success_rate}
              suffix="%"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6} lg={4}>
          <Card size="small">
            <Statistic
              title="Avg Open Rate"
              value={stats.avg_open_rate}
              suffix="%"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6} lg={4}>
          <Card size="small">
            <Statistic
              title="This Month"
              value={stats.campaigns_this_month}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6} lg={4}>
          <Card size="small">
            <Statistic
              title="This Week"
              value={stats.emails_this_week}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        {/* Compose Tab */}
        <TabPane tab={<span><SendOutlined />Compose Email</span>} key="compose">
          <Row gutter={24}>
            <Col xs={24} lg={14}>
              <Card title={
                <span>
                  <SendOutlined style={{ marginRight: 8 }} />
                  Compose Email
                </span>
              }>
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontWeight: 'bold', marginBottom: 8, display: 'block' }}>
                        Email Type
                      </label>
                      <Select
                        value={composeForm.type}
                        onChange={(value) => setComposeForm({ ...composeForm, type: value })}
                        style={{ width: '100%' }}
                      >
                        <Option value="single">Single Recipient</Option>
                        <Option value="bulk">Bulk Email (Manual)</Option>
                        <Option value="candidates">All Shortlisted Candidates</Option>
                      </Select>
                    </div>
                  </Col>

                  <Col xs={24} sm={12}>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontWeight: 'bold', marginBottom: 8, display: 'block' }}>
                        Priority
                      </label>
                      <Select
                        value={composeForm.priority}
                        onChange={(value) => setComposeForm({ ...composeForm, priority: value })}
                        style={{ width: '100%' }}
                      >
                        <Option value="low">Low</Option>
                        <Option value="normal">Normal</Option>
                        <Option value="high">High</Option>
                        <Option value="urgent">Urgent</Option>
                      </Select>
                    </div>
                  </Col>
                </Row>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontWeight: 'bold', marginBottom: 8, display: 'block' }}>
                    Email Template *
                  </label>
                  <Select
                    value={composeForm.template_id}
                    onChange={handleTemplateSelect}
                    style={{ width: '100%', height: 'auto' }}
                    placeholder="Select a template"
                    showSearch
                    filterOption={(input, option) =>
                      !!option?.children?.toString().toLowerCase().includes(input.toLowerCase())
                    }

                  >
                    {templates.map(template => (
                      <Option key={template.id} value={template.id.toString()}>
                        <div>
                          <div style={{ fontWeight: 'bold' }}>{template.name}</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            {template.category} • {template.variables.length} variables
                          </div>
                        </div>
                      </Option>
                    ))}
                  </Select>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontWeight: 'bold', marginBottom: 8, display: 'block' }}>
                    Signature
                  </label>
                  <Select
                    value={composeForm.signature_id}
                    onChange={(value) => setComposeForm({ ...composeForm, signature_id: value })}
                    style={{ width: '100%' }}
                    placeholder="Select signature (optional)"
                    allowClear
                  >
                    {signatures.map(signature => (
                      <Option key={signature.id} value={signature.id.toString()}>
                        {signature.name} {signature.is_default && '(Default)'}
                      </Option>
                    ))}
                  </Select>
                </div>

                {/* Recipients */}
                {composeForm.type === 'single' && (
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontWeight: 'bold', marginBottom: 8, display: 'block' }}>
                      Recipient Email *
                    </label>
                    <Input
                      type="email"
                      placeholder="candidate@example.com"
                      value={composeForm.recipient_email}
                      onChange={(e) => setComposeForm({ ...composeForm, recipient_email: e.target.value })}
                    />
                  </div>
                )}

                {composeForm.type === 'bulk' && (
                  <>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontWeight: 'bold', marginBottom: 8, display: 'block' }}>
                        Recipient Emails
                      </label>
                      <TextArea
                        placeholder="Enter emails separated by commas or new lines"
                        value={composeForm.recipient_emails}
                        onChange={(e) => setComposeForm({ ...composeForm, recipient_emails: e.target.value })}
                        rows={4}
                      />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontWeight: 'bold', marginBottom: 8, display: 'block' }}>
                        Or Candidate IDs
                      </label>
                      <Input
                        placeholder="Enter candidate IDs separated by commas (e.g., 1,2,3)"
                        value={composeForm.candidate_ids}
                        onChange={(e) => setComposeForm({ ...composeForm, candidate_ids: e.target.value })}
                      />
                    </div>
                  </>
                )}

                {composeForm.type === 'candidates' && (
                  <Alert
                    message="Automated Candidate Selection"
                    description="This will send emails to all shortlisted and available candidates in your database."
                    type="info"
                    style={{ marginBottom: 16 }}
                  />
                )}

                {/* Template Variables */}
                {Object.keys(composeForm.variables).length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontWeight: 'bold', marginBottom: 8, display: 'block' }}>
                      Template Variables
                    </label>
                    <Card size="small">
                      <Row gutter={16}>
                        {Object.keys(composeForm.variables).map(variable => (
                          <Col xs={24} sm={12} key={variable}>
                            <div style={{ marginBottom: 12 }}>
                              <label style={{ marginBottom: 4, display: 'block' }}>
                                {variable.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </label>
                              <Input
                                placeholder={`Enter ${variable}`}
                                value={composeForm.variables[variable]}
                                onChange={(e) => setComposeForm({
                                  ...composeForm,
                                  variables: {
                                    ...composeForm.variables,
                                    [variable]: e.target.value
                                  }
                                })}
                              />
                            </div>
                          </Col>
                        ))}
                      </Row>
                    </Card>
                  </div>
                )}

                {/* Scheduling */}
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col xs={24} sm={12}>
                    <div>
                      <Switch
                        checked={composeForm.send_immediately}
                        onChange={(checked) => setComposeForm({ ...composeForm, send_immediately: checked })}
                        style={{ marginRight: 8 }}
                      />
                      <span>Send Immediately</span>
                    </div>
                  </Col>

                  {!composeForm.send_immediately && (
                    <Col xs={24} sm={12}>
                      <DatePicker
                        showTime
                        placeholder="Schedule for"
                        value={composeForm.scheduled_at}
                        onChange={(date) => setComposeForm({ ...composeForm, scheduled_at: date })}
                        style={{ width: '100%' }}
                        disabledDate={(current) => current && current < moment().startOf('day')}
                      />
                    </Col>
                  )}
                </Row>

                <Button
                  type="primary"
                  size="large"
                  icon={<SendOutlined />}
                  loading={loading}
                  onClick={handleSendEmail}
                  block
                >
                  {loading
                    ? 'Sending...'
                    : composeForm.send_immediately
                      ? `Send ${composeForm.type === 'single' ? 'Email' : 'Bulk Email'}`
                      : `Schedule ${composeForm.type === 'single' ? 'Email' : 'Bulk Email'}`
                  }
                </Button>
              </Card>
            </Col>

            <Col xs={24} lg={10}>
              {/* Template Preview */}
              {composeForm.template_id && (
                <Card title={
                  <span>
                    <EyeOutlined style={{ marginRight: 8 }} />
                    Template Preview
                  </span>
                } size="small">
                  {(() => {
                    const template = templates.find(t => t.id.toString() === composeForm.template_id);
                    if (!template) return null;

                    let previewSubject = template.subject;
                    let previewBody = template.body_html;

                    // Replace variables with values or placeholders
                    Object.keys(composeForm.variables).forEach(variable => {
                      const value = composeForm.variables[variable] || `[${variable}]`;
                      previewSubject = previewSubject.replace(new RegExp(`\\{\\{${variable}\\}\\}`, 'g'), value);
                      previewBody = previewBody.replace(new RegExp(`\\{\\{${variable}\\}\\}`, 'g'), value);
                    });

                    return (
                      <div>
                        <div style={{ marginBottom: 12 }}>
                          <strong>Subject:</strong>
                          <div style={{
                            background: '#f5f5f5',
                            padding: 8,
                            borderRadius: 4,
                            marginTop: 4,
                            fontSize: '14px'
                          }}>
                            {previewSubject}
                          </div>
                        </div>

                        <div>
                          <strong>Body Preview:</strong>
                          <div
                            style={{
                              background: '#f5f5f5',
                              padding: 12,
                              borderRadius: 4,
                              marginTop: 4,
                              maxHeight: 300,
                              overflow: 'auto',
                              fontSize: '12px'
                            }}
                            dangerouslySetInnerHTML={{ __html: previewBody }}
                          />
                        </div>
                      </div>
                    );
                  })()}
                </Card>
              )}

              {/* Quick Actions */}
              <Card title="Quick Actions" size="small" style={{ marginTop: 16 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button
                    icon={<PlusOutlined />}
                    onClick={() => setTemplateDrawerVisible(true)}
                    block
                  >
                    Create New Template
                  </Button>
                  <Button
                    icon={<SettingOutlined />}
                    onClick={() => setSignatureDrawerVisible(true)}
                    block
                  >
                    Create New Signature
                  </Button>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={() => {
                      loadTemplates();
                      loadSignatures();
                      loadStats();
                    }}
                    block
                  >
                    Refresh Data
                  </Button>
                </Space>
              </Card>
            </Col>
          </Row>
        </TabPane>

        {/* Templates Tab */}
        <TabPane tab={<span><FileTextOutlined />Templates ({templates.length})</span>} key="templates">
          <Card>
            <Row gutter={16} align="middle" style={{ marginBottom: 16 }}>
              <Col xs={24} sm={12}>
                <Title level={4} style={{ margin: 0 }}>Email Templates</Title>
              </Col>
              <Col xs={24} sm={12} style={{ textAlign: 'right' }}>
                <Space>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setTemplateDrawerVisible(true)}
                  >
                    Create Template
                  </Button>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={loadTemplates}
                  >
                    Refresh
                  </Button>
                </Space>
              </Col>
            </Row>

            {/* Quick Start Templates */}
            <Card size="small" title="Quick Start Templates" style={{ marginBottom: 16 }}>
              <Row gutter={[16, 16]}>
                {getDefaultTemplates().map((template, index) => (
                  <Col xs={24} sm={12} lg={8} key={index}>
                    <Card
                      size="small"
                      hoverable
                      actions={[
                        <Button
                          type="link"
                          onClick={() => useDefaultTemplate(template)}
                          icon={<PlusOutlined />}
                        >
                          Use Template
                        </Button>
                      ]}
                    >
                      <Card.Meta
                        title={template.name}
                        description={
                          <div>
                            <Tag color="blue">{template.category}</Tag>
                            <Paragraph
                              ellipsis={{ rows: 2 }}
                              style={{ marginTop: 8, fontSize: '12px' }}
                            >
                              {template.subject}
                            </Paragraph>
                          </div>
                        }
                      />
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>

            <Table
              columns={templateColumns}
              dataSource={templates}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} templates`
              }}
            />
          </Card>
        </TabPane>

        {/* Signatures Tab */}
        <TabPane tab={<span><EditOutlined />Signatures ({signatures.length})</span>} key="signatures">
          <Card>
            <Row gutter={16} align="middle" style={{ marginBottom: 16 }}>
              <Col xs={24} sm={12}>
                <Title level={4} style={{ margin: 0 }}>Email Signatures</Title>
              </Col>
              <Col xs={24} sm={12} style={{ textAlign: 'right' }}>
                <Space>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setSignatureDrawerVisible(true)}
                  >
                    Create Signature
                  </Button>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={loadSignatures}
                  >
                    Refresh
                  </Button>
                </Space>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              {signatures.map(signature => (
                <Col xs={24} sm={12} lg={8} key={signature.id}>
                  <Card
                    size="small"
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>{signature.name}</span>
                        {signature.is_default && <Badge status="success" text="Default" />}
                      </div>
                    }
                    actions={[
                      <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => {
                          setSignatureForm({
                            name: signature.name,
                            html_content: signature.html_content,
                            company_logo_url: signature.company_logo_url || '',
                            company_name: signature.company_name,
                            is_default: signature.is_default
                          });
                          setSignatureDrawerVisible(true);
                        }}
                      >
                        Edit
                      </Button>,
                      <Popconfirm
                        title="Delete signature?"
                        onConfirm={() => deleteSignature(signature.id)}
                      >
                        <Button type="link" danger icon={<DeleteOutlined />}>
                          Delete
                        </Button>
                      </Popconfirm>
                    ]}
                  >
                    <div
                      style={{
                        minHeight: 80,
                        fontSize: '12px',
                        backgroundColor: '#fafafa',
                        padding: 8,
                        borderRadius: 4
                      }}
                      dangerouslySetInnerHTML={{ __html: signature.html_content }}
                    />
                  </Card>
                </Col>
              ))}
            </Row>

            {signatures.length === 0 && (
              <Empty
                description="No signatures found"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setSignatureDrawerVisible(true)}
                >
                  Create Your First Signature
                </Button>
              </Empty>
            )}
          </Card>
        </TabPane>

        {/* Campaigns Tab */}
        <TabPane tab={<span><BarChartOutlined />Campaigns ({campaigns.length})</span>} key="campaigns">
          <Card>
            <Row gutter={16} align="middle" style={{ marginBottom: 16 }}>
              <Col xs={24} sm={12}>
                <Title level={4} style={{ margin: 0 }}>Email Campaigns</Title>
              </Col>
              <Col xs={24} sm={12} style={{ textAlign: 'right' }}>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={loadCampaigns}
                >
                  Refresh
                </Button>
              </Col>
            </Row>

            <Table
              columns={campaignColumns}
              dataSource={campaigns}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} campaigns`
              }}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* Template Creation/Edit Drawer */}
      <Drawer
        title={selectedTemplate ? 'Edit Template' : 'Create Email Template'}
        width={600}
        open={templateDrawerVisible}
        onClose={() => {
          setTemplateDrawerVisible(false);
          setSelectedTemplate(null);
          setTemplateForm({
            name: '',
            category: 'general',
            subject: '',
            body_html: '',
            is_system_template: false
          });
        }}
        extra={
          <Button
            type="primary"
            loading={loading}
            onClick={handleCreateTemplate}
          >
            {selectedTemplate ? 'Update' : 'Create'} Template
          </Button>
        }
      >
        <Row gutter={16}>
          <Col span={12}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 'bold', marginBottom: 8, display: 'block' }}>
                Template Name *
              </label>
              <Input
                placeholder="e.g., Interview Invitation"
                value={templateForm.name}
                onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
              />
            </div>
          </Col>

          <Col span={12}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 'bold', marginBottom: 8, display: 'block' }}>
                Category
              </label>
              <Select
                value={templateForm.category}
                onChange={(value) => setTemplateForm({ ...templateForm, category: value })}
                style={{ width: '100%' }}
              >
                <Option value="general">General</Option>
                <Option value="interview">Interview</Option>
                <Option value="offer_letter">Offer Letter</Option>
                <Option value="onboarding">Onboarding</Option>
                <Option value="rejection">Rejection</Option>
                <Option value="acknowledgment">Acknowledgment</Option>
                <Option value="follow_up">Follow Up</Option>
              </Select>
            </div>
          </Col>
        </Row>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontWeight: 'bold', marginBottom: 8, display: 'block' }}>
            Subject Line *
          </label>
          <Input
            placeholder="Welcome to {{company_name}} - {{candidate_name}}"
            value={templateForm.subject}
            onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
          />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Use {`{{variable_name}}`} for dynamic content
          </Text>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontWeight: 'bold', marginBottom: 8, display: 'block' }}>
            Email Body (HTML) *
          </label>
          <TextArea
            placeholder="<h2>Welcome {{candidate_name}}!</h2><p>We're excited to have you join {{company_name}}...</p>"
            value={templateForm.body_html}
            onChange={(e) => setTemplateForm({ ...templateForm, body_html: e.target.value })}
            rows={12}
          />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            HTML formatting supported. Use {`{{variable_name}}`} for personalization
          </Text>
        </div>

        {/* Variables Preview */}
        {templateForm.subject || templateForm.body_html ? (
          <Card size="small" title="Detected Variables">
            <Space wrap>
              {extractTemplateVariables(templateForm.body_html, templateForm.subject).map(variable => (
                <Tag key={variable}>{variable}</Tag>
              ))}
            </Space>
          </Card>
        ) : null}
      </Drawer>

      {/* Signature Creation/Edit Drawer */}
      <Drawer
        title="Create Email Signature"
        width={500}
        open={signatureDrawerVisible}
        onClose={() => {
          setSignatureDrawerVisible(false);
          setSignatureForm({
            name: '',
            html_content: '',
            company_logo_url: '',
            company_name: 'Navikenz India Pvt Ltd',
            is_default: false
          });
        }}
        extra={
          <Button
            type="primary"
            loading={loading}
            onClick={handleCreateSignature}
          >
            Create Signature
          </Button>
        }
      >
        <Row gutter={16}>
          <Col span={12}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 'bold', marginBottom: 8, display: 'block' }}>
                Signature Name *
              </label>
              <Input
                placeholder="e.g., HR Team Signature"
                value={signatureForm.name}
                onChange={(e) => setSignatureForm({ ...signatureForm, name: e.target.value })}
              />
            </div>
          </Col>

          <Col span={12}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 'bold', marginBottom: 8, display: 'block' }}>
                Company Name
              </label>
              <Input
                value={signatureForm.company_name}
                onChange={(e) => setSignatureForm({ ...signatureForm, company_name: e.target.value })}
              />
            </div>
          </Col>
        </Row>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontWeight: 'bold', marginBottom: 8, display: 'block' }}>
            Company Logo URL
          </label>
          <Input
            placeholder="https://company.com/logo.png"
            value={signatureForm.company_logo_url}
            onChange={(e) => setSignatureForm({ ...signatureForm, company_logo_url: e.target.value })}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <Switch
            checked={signatureForm.is_default}
            onChange={(checked) => setSignatureForm({ ...signatureForm, is_default: checked })}
            style={{ marginRight: 8 }}
          />
          <span>Set as Default Signature</span>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontWeight: 'bold', marginBottom: 8, display: 'block' }}>
            Signature HTML *
          </label>
          <TextArea
            placeholder="<p>Best regards,<br><strong>HR Team</strong><br>Navikenz India Pvt Ltd<br>Email: hr@navikenz.com</p>"
            value={signatureForm.html_content}
            onChange={(e) => setSignatureForm({ ...signatureForm, html_content: e.target.value })}
            rows={8}
          />
        </div>

        {/* Signature Preview */}
        {signatureForm.html_content && (
          <Card size="small" title="Preview">
            <div
              style={{
                backgroundColor: '#fafafa',
                padding: 12,
                borderRadius: 4,
                fontSize: '12px'
              }}
              dangerouslySetInnerHTML={{ __html: signatureForm.html_content }}
            />
          </Card>
        )}
      </Drawer>

      {/* Campaign Details Drawer */}
      <Drawer
        title="Campaign Details"
        width={500}
        open={campaignDrawerVisible}
        onClose={() => setCampaignDrawerVisible(false)}
      >
        {selectedCampaign && (
          <div>
            <Card size="small" title="Campaign Information">
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="Total Recipients"
                    value={selectedCampaign.recipient_count}
                    prefix={<TeamOutlined />}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Successfully Sent"
                    value={selectedCampaign.sent_count}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
              </Row>

              <Row gutter={16} style={{ marginTop: 16 }}>
                <Col span={12}>
                  <Statistic
                    title="Failed"
                    value={selectedCampaign.failed_count}
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Success Rate"
                    value={selectedCampaign.recipient_count > 0 ?
                      Math.round((selectedCampaign.sent_count / selectedCampaign.recipient_count) * 100) : 0
                    }
                    suffix="%"
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
              </Row>
            </Card>

            {(selectedCampaign.open_rate !== undefined || selectedCampaign.click_rate !== undefined) && (
              <Card size="small" title="Performance Metrics" style={{ marginTop: 16 }}>
                <Row gutter={16}>
                  {selectedCampaign.open_rate !== undefined && (
                    <Col span={12}>
                      <Statistic
                        title="Open Rate"
                        value={selectedCampaign.open_rate}
                        suffix="%"
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Col>
                  )}
                  {selectedCampaign.click_rate !== undefined && (
                    <Col span={12}>
                      <Statistic
                        title="Click Rate"
                        value={selectedCampaign.click_rate}
                        suffix="%"
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Col>
                  )}
                </Row>
              </Card>
            )}

            <Card size="small" title="Timeline" style={{ marginTop: 16 }}>
              <div>
                <div style={{ marginBottom: 8 }}>
                  <strong>Created:</strong> {moment(selectedCampaign.created_at).format('MMMM DD, YYYY HH:mm')}
                </div>
                {selectedCampaign.completed_at && (
                  <div>
                    <strong>Completed:</strong> {moment(selectedCampaign.completed_at).format('MMMM DD, YYYY HH:mm')}
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </Drawer>

      {/* Template Preview Modal */}
      <Modal
        title="Template Preview"
        open={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        footer={null}
        width={700}
      >
        <div
          style={{
            backgroundColor: '#fff',
            padding: 20,
            borderRadius: 4,
            border: '1px solid #d9d9d9'
          }}
          dangerouslySetInnerHTML={{ __html: previewContent }}
        />
      </Modal>
    </div>
  );
};

export default EmailAutomation;
