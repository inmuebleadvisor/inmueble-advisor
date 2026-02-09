# Estructura Completa del Proyecto 
 
## Raiz del Proyecto (Archivos) 
.env.local
.firebaserc
.gitignore
build_log.txt
cloud_functions_analysis.md
eslint.config.js
firebase.json
firestore.indexes.json
firestore.rules
generate_tree.bat
index.html
package-lock.json
package.json
README.md
repair_antigravity.ps1
storage.rules
test_debug.txt
test_logs.txt
test_results.txt
vercel.json
vite.config.js
 
## Frontend (SRC) 
Listado de rutas de carpetas para el volumen OS
El número de serie del volumen es 9650-5F4F
C:\USERS\NOVAT\INMUEBLE-ADVISOR\SRC
|   App.css
|   App.jsx
|   index.css
|   main.jsx
|   README.md
|   
+---assets
|       agent_tablet_success.png
|       landing_hero_bg.png
|       react.svg
|       
+---components
|   |   README.md
|   |   
|   +---admin
|   |       AdminHeader.jsx
|   |       AdminSidebar.jsx
|   |       DataTable.jsx
|   |       ExternalAdvisorModal.jsx
|   |       
|   +---auth
|   |       ProtectedRoute.jsx
|   |       
|   +---catalogo
|   |       AmenidadesList.jsx
|   |       Carousel.css
|   |       Carousel.jsx
|   |       DevelopmentDetailsContent.jsx
|   |       DevelopmentInfoSection.jsx
|   |       FinanciamientoWidget.jsx
|   |       ModelDetailsContent.jsx
|   |       PropertyCard.css
|   |       PropertyCard.jsx
|   |       test_DevelopmentInfoSection.jsx
|   |       test_ModelDetailsContent.jsx
|   |       test_PropertyCard.jsx
|   |       
|   +---common
|   |   |   AppointmentScheduler.jsx
|   |   |   CaracteristicasBox.jsx
|   |   |   Delightbox.css
|   |   |   Delightbox.jsx
|   |   |   FavoriteBtn.jsx
|   |   |   Icons.jsx
|   |   |   ImageLoader.jsx
|   |   |   MetaTracker.jsx
|   |   |   README.md
|   |   |   ScrollToTop.jsx
|   |   |   test_MetaTracker.jsx
|   |   |   TrustBadges.jsx
|   |   |   
|   |   +---WhatsAppButton
|   |   |       README.md
|   |   |       WhatsAppButton.css
|   |   |       WhatsAppButton.jsx
|   |   |       
|   |   \---__tests__
|   |           test_ScrollToTop.jsx
|   |           
|   +---layout
|   |   |   FilterBar.jsx
|   |   |   Navbar.jsx
|   |   |   RouteRemounter.jsx
|   |   |   SearchBar.jsx
|   |   |   StickyActionPanel.jsx
|   |   |   ThemeToggle.jsx
|   |   |   
|   |   \---__tests__
|   |           test_Navbar.jsx
|   |           
|   +---leads
|   |       LeadActionModal.jsx
|   |       LeadCaptureForm.jsx
|   |       LeadCard.css
|   |       LeadCard.jsx
|   |       README.md
|   |       test_LeadCaptureForm.jsx
|   |       
|   \---modals
|           CitySelectorModal.css
|           CitySelectorModal.jsx
|           FilterModal.jsx
|           HighlightsModal.css
|           HighlightsModal.jsx
|           MapModal.css
|           MapModal.jsx
|           Modal.jsx
|           README.md
|           test_CitySelectorModal.jsx
|           test_HighlightsModal.jsx
|           
+---config
|       constants.js
|       posthog.js
|       README.md
|       test_constants.js
|       theme.config.js
|       
+---context
|       CatalogContext.jsx
|       FavoritesContext.jsx
|       README.md
|       ServiceContext.jsx
|       test_CatalogContext.jsx
|       test_ServiceContext.jsx
|       ThemeContext.jsx
|       UserContext.jsx
|       
+---firebase
|       config.js
|       
+---hooks
|       README.md
|       test_useFavoritesViewModel.js
|       test_useService.js
|       useAdminData.js
|       useAnalytics.js
|       useCatalogFilter.js
|       useFavoritesViewModel.js
|       useScrollReveal.js
|       useService.js
|       useStickyPanel.js
|       
+---layouts
|       AdminLayout.jsx
|       MainLayout.jsx
|       
+---models
+---repositories
|       analyticEvents.repository.js
|       catalog.repository.js
|       config.repository.js
|       externalAdvisor.repository.js
|       lead.repository.js
|       README.md
|       user.repository.js
|       
+---screens
|   |   README.md
|   |   
|   +---admin
|   |       AdminDataExport.jsx
|   |       AdminHome.jsx
|   |       AdminLeads.jsx
|   |       AdminUsers.jsx
|   |       AdvisorsDirectory.jsx
|   |       
|   +---catalogo
|   |       Catalogo.jsx
|   |       DetalleDesarrollo.jsx
|   |       DetalleModelo.jsx
|   |       Mapa.jsx
|   |       README.md
|   |       
|   \---cliente
|       |   Favoritos.jsx
|       |   OnboardingCliente.jsx
|       |   Perfil.jsx
|       |   README.md
|       |   test_Favoritos.jsx
|       |   test_OnboardingCliente.jsx
|       |   test_Perfil.jsx
|       |   
|       \---favoritos
|           |   Favoritos.module.css
|           |   
|           \---components
|                   ComparisonTable.jsx
|                   FavoritesGrid.jsx
|                   test_ComparisonTable.js
|                   test_FavoritesGrid.js
|                   
+---services
|       admin.service.js
|       analytics.service.js
|       appointment.service.js
|       auth.service.js
|       catalog.service.js
|       client.service.js
|       config.service.js
|       crm.service.js
|       externalAdvisor.service.js
|       favorites.service.js
|       financial.service.js
|       leadAssignment.service.js
|       meta.service.js
|       META_TRACKING.md
|       README.md
|       service.provider.js
|       
+---styles
|   |   Admin.css
|   |   buttons.css
|   |   cards.css
|   |   Catalogo.css
|   |   Header.css
|   |   Layout.css
|   |   LeadCaptureForm.css
|   |   Mapa.css
|   |   ModelDetailsContent.css
|   |   Onboarding.css
|   |   Perfil.css
|   |   README.md
|   |   STYLES_GUIDE.md
|   |   
|   \---components
|           DevelopmentDetails.css
|           FavoriteBtn.css
|           Spinner.css
|           StickyActionPanel.css
|           
+---types
|       Desarrollo.js
|       Modelo.js
|       README.md
|       
\---utils
        catalogEnricher.js
        catalogFilters.js
        dataHelpers.js
        deferScripts.js
        exportUtils.js
        formatters.js
        README.md
        
 
## Backend (Functions/SRC) 
Listado de rutas de carpetas para el volumen OS
El número de serie del volumen es 9650-5F4F
C:\USERS\NOVAT\INMUEBLE-ADVISOR\FUNCTIONS\SRC
|   index.ts
|   
+---config
|       constants.ts
|       
+---core
|   +---constants
|   |       index.ts
|   |       meta.ts
|   |       test_compilation.ts
|   |       
|   +---entities
|   |       User.ts
|   |       
|   +---errors
|   +---interfaces
|   |       LeadRepository.ts
|   |       NotificationPort.ts
|   |       TrackingService.ts
|   |       
|   +---services
|   |       BaseMessageBuilder.ts
|   |       LeadMessageBuilder.ts
|   |       README.md
|   |       UserMessageBuilder.ts
|   |       
|   +---usecases
|   |       LogPriceChange.ts
|   |       NotifyNewLead.ts
|   |       NotifyNewUser.ts
|   |       PromoteUserUseCase.ts
|   |       RegisterConversion.ts
|   |       
|   \---utils
|           ipUtils.ts
|           README.md
|           
+---infrastructure
|   +---repositories
|   |       FirebaseLeadRepository.ts
|   |       FirebaseUserRepository.ts
|   |       PriceHistoryRepository.ts
|   |       
|   +---services
|   |       MetaAdsService.ts
|   |       README.md
|   |       TelegramService.ts
|   |       test_MetaAdsService.ts
|   |       
|   \---utils
+---interface
|   +---callable
|   |       onLeadContactMETA.ts
|   |       onLeadCreatedMETA.ts
|   |       onLeadIntentMETA.ts
|   |       onLeadPageViewMETA.ts
|   |       promoteToAdvisor.ts
|   |       
|   +---http
|   \---triggers
|           onLeadCreated.ts
|           onModelUpdate.ts
|           onUserCreated.ts
|           
+---scripts
|       testUserNotify.ts
|       verifyBigQuery.js
|       verifyBigQuery.ts
|       
\---tests
        LeadMessageBuilder.test.ts
        UserMessageBuilder.test.ts
        
 
## Documentos 
Listado de rutas de carpetas para el volumen OS
El número de serie del volumen es 9650-5F4F
C:\USERS\NOVAT\INMUEBLE-ADVISOR\DOCUMENTOS
|   BIGQUERY_SETUP.md
|   DATOSESTRUCTURA.md
|   ESTRUCTURA_ACTUAL.md
|   ESTRUCTURA_COMPLETA.md
|   MANUALDEARQUITECTURA.md
|   Manual_Auditoria_Ingenieria_Agentica.md
|   MANUAL_MODULO_ADMINISTRADOR.md
|   PLAN_DE_AUDITORIA.md
|   
+---decisions
|       001-uso-arquitectura-hexagonal.md
|       002-persistencia-poliglota-bq-firestore.md
|       003-patron-dependency-injection.md
|       
\---docx
        CloudFunction.docx
        CODIGOCLOUD.docx
        DATOSESTRUCTURA.docx
        DATOSFLUJO.docx
        DATOSMANUAL.docx
        ESTILOS_GUIA.docx
        ESTILOS_TEMPORADA.docx
        GUIA_DESARROLLO.docx
        LOGICA_AGENDAMIENTO.docx
        MANUALDEARQUITECTURA.docx
        MANUAL_AUDITORIA_CONVERSION TRACKING
        ModuloAdmin.docx
        README_functions.docx
        README_ROOT.docx
        README_src.docx
        README_src_components.docx
        README_src_context.docx
        README_src_hooks.docx
        README_src_repositories.docx
        README_src_screens.docx
        README_src_services.docx
        README_src_types.docx
        README_src_utils.docx
        Reporte_Campos_Importacion.docx
        
