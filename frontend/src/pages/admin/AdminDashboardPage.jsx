import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import AdminWinnerBox from "../../components/admin/AdminWinnerBox";

import {
  buildStaticUrl,
  changePasswordWithPin,
  clearAdminSession,
  createCustomer,
  createNextContest,
  getAdminDashboardData,
  getAdminProfile,
  getAdminUser,
  getContestHistory,
  getCustomers,
  getPurchases,
  registerPurchase,
  updateBusiness,
  updateContest,
  updateCustomer,
  updatePromotions,
  updateSocialLinks,
  uploadBusinessLogo,
} from "../../services/adminApi";

const ROOT_DOMAIN = import.meta.env.VITE_ROOT_DOMAIN || "kliente.cl";

const emptyPromotion = {
  title: "",
  description: "",
  tag: "",
  active: true,
};

const emptySocialLink = {
  name: "",
  label: "",
  url: "",
  active: true,
};

const emptyCustomerForm = {
  id: "",
  name: "",
  rut: "",
  phone: "",
  email: "",
  notes: "",
  active: true,
};

const emptyPurchaseForm = {
  customerRut: "",
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  ticketNumber: "",
  productName: "",
  totalAmount: "",
  totalKg: "",
  manualPoints: "",
};

const emptySecurityForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const emptyContest = {
  id: "",
  title: "Concurso del Mes",
  description: "Participa comprando el producto del concurso.",
  prizeTitle: "Premio del concurso",
  prizeDescription: "",
  contestPeriod: "monthly",
  productName: "Pan",
  startDate: "",
  endDate: "",
  minimumPurchaseAmount: 0,
  minimumPurchaseKg: 0,
  pointsPerPurchase: 1,
  targetPoints: 100,
  status: "active",
};

const tabs = [
  { id: "business", label: "Configuración negocio" },
  { id: "security", label: "Seguridad cuenta" },
  { id: "contest", label: "Configuración sorteo" },
  { id: "promotions", label: "5 promociones" },
  { id: "customers-purchases", label: "Crear cliente / registrar compra" },
  { id: "customers", label: "Base de clientes" },
  { id: "social", label: "Redes sociales / QR" },
  { id: "history", label: "Historial compras" },
  { id: "contest-history", label: "Historial sorteos / ganadores" },
];

const securityInputStyle = {
  width: "100%",
  border: "1px solid rgba(148, 163, 184, 0.38)",
  borderRadius: 18,
  padding: "15px 17px",
  background: "rgba(15, 23, 42, 0.82)",
  color: "#ffffff",
  outline: "none",
  fontSize: "1rem",
  fontWeight: 800,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
};

const securityLabelStyle = {
  display: "grid",
  gap: 9,
  color: "rgba(255,255,255,0.92)",
  fontSize: "0.95rem",
  fontWeight: 900,
};

function normalizePromotions(promotions = []) {
  const base = promotions.slice(0, 5).map((item) => ({
    id: item.id,
    title: item.title || "",
    description: item.description || "",
    tag: item.tag || "",
    active: Boolean(item.active),
  }));

  while (base.length < 5) {
    base.push({
      ...emptyPromotion,
      tag: `Promo ${base.length + 1}`,
    });
  }

  return base;
}

function normalizeSocialLinks(socialLinks = []) {
  const defaultNames = ["WhatsApp", "Instagram", "Facebook"];
  const defaultLabels = ["Escanea", "Síguenos", "Visítanos"];

  const base = socialLinks.slice(0, 3).map((item) => ({
    id: item.id,
    name: item.name || "",
    label: item.label || "",
    url: item.url || "",
    active: Boolean(item.active),
  }));

  while (base.length < 3) {
    const index = base.length;

    base.push({
      ...emptySocialLink,
      name: defaultNames[index] || "",
      label: defaultLabels[index] || "",
    });
  }

  return base;
}

function toDatetimeLocal(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (number) => String(number).padStart(2, "0");

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("es-CL", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function getDefaultStartDate() {
  return toDatetimeLocal(new Date());
}

function getDefaultEndDateByPeriod(period) {
  const date = new Date();

  if (period === "weekly") {
    date.setDate(date.getDate() + 7);
  } else if (period === "biweekly") {
    date.setDate(date.getDate() + 15);
  } else {
    date.setDate(date.getDate() + 30);
  }

  return toDatetimeLocal(date);
}

function normalizeContest(contest) {
  if (!contest) {
    return {
      ...emptyContest,
      startDate: getDefaultStartDate(),
      endDate: getDefaultEndDateByPeriod("monthly"),
    };
  }

  return {
    id: contest.id || "",
    title: contest.title || "",
    description: contest.description || "",
    prizeTitle: contest.prizeTitle || "",
    prizeDescription: contest.prizeDescription || "",
    contestPeriod: contest.contestPeriod || "monthly",
    productName: contest.productName || "",
    startDate: toDatetimeLocal(contest.startDate),
    endDate: toDatetimeLocal(contest.endDate),
    minimumPurchaseAmount: contest.minimumPurchaseAmount || 0,
    minimumPurchaseKg: contest.minimumPurchaseKg || 0,
    pointsPerPurchase: contest.pointsPerPurchase || 1,
    targetPoints: contest.targetPoints || 0,
    status: contest.status || "active",
  };
}

function buildNextContestDraft(currentContest) {
  const contestPeriod = currentContest.contestPeriod || "monthly";

  return {
    ...currentContest,
    id: "",
    title: currentContest.title || "Nuevo sorteo",
    description:
      currentContest.description ||
      "Participa comprando en el local durante el periodo del sorteo.",
    prizeTitle: currentContest.prizeTitle || "Premio del sorteo",
    prizeDescription: currentContest.prizeDescription || "",
    contestPeriod,
    productName: currentContest.productName || "Producto del sorteo",
    startDate: getDefaultStartDate(),
    endDate: getDefaultEndDateByPeriod(contestPeriod),
    status: "active",
  };
}

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString("es-CL")}`;
}

function formatContestStatus(status) {
  if (status === "active") return "Activo";
  if (status === "finished") return "Finalizado";
  if (status === "cancelled") return "Cancelado";
  if (status === "draft") return "Borrador";
  return status || "-";
}

function isLocalFrontend() {
  return (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );
}

function isBlockedByPinError(error) {
  return error?.code === "USER_LOCKED_BY_PIN" || Number(error?.status) === 423;
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("business");
  const [user, setUser] = useState(getAdminUser());
  const [loading, setLoading] = useState(true);

  const [savingBusiness, setSavingBusiness] = useState(false);
  const [savingSecurity, setSavingSecurity] = useState(false);
  const [savingContest, setSavingContest] = useState(false);
  const [savingNextContest, setSavingNextContest] = useState(false);
  const [savingPromotions, setSavingPromotions] = useState(false);
  const [savingSocialLinks, setSavingSocialLinks] = useState(false);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [savingPurchase, setSavingPurchase] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [sessionError, setSessionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [purchaseStatusMessage, setPurchaseStatusMessage] = useState("");
  const [purchaseStatusType, setPurchaseStatusType] = useState("");

  const [visitsTotal, setVisitsTotal] = useState(0);

  const [business, setBusiness] = useState({
    name: "",
    slug: "",
    publicUrl: "",
    rut: "",
    address: "",
    phone: "",
    email: "",
    logoUrl: "",
  });

  const [securityForm, setSecurityForm] = useState(emptySecurityForm);
  const [showPinConfirmModal, setShowPinConfirmModal] = useState(false);
  const [pinConfirmValue, setPinConfirmValue] = useState("");
  const [pinModalError, setPinModalError] = useState("");

  const [contest, setContest] = useState(emptyContest);
  const [contestHistory, setContestHistory] = useState([]);
  const [promotions, setPromotions] = useState(normalizePromotions());
  const [socialLinks, setSocialLinks] = useState(normalizeSocialLinks());

  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerForm, setCustomerForm] = useState(emptyCustomerForm);

  const [purchases, setPurchases] = useState([]);
  const [allPurchases, setAllPurchases] = useState([]);
  const [purchaseForm, setPurchaseForm] = useState(emptyPurchaseForm);

  const logoPreviewUrl = useMemo(() => {
    return buildStaticUrl(business.logoUrl);
  }, [business.logoUrl]);

  const publicBusinessUrl = useMemo(() => {
    if (business.publicUrl) {
      return business.publicUrl;
    }

    if (!business.slug) {
      return "";
    }

    return `https://${business.slug}.${ROOT_DOMAIN}`;
  }, [business.publicUrl, business.slug]);

  const publicScreenUrl = useMemo(() => {
    const slug = business.slug || "demo";

    if (isLocalFrontend()) {
      return `/?slug=${slug}`;
    }

    return publicBusinessUrl || "/";
  }, [business.slug, publicBusinessUrl]);

  useEffect(() => {
    let mounted = true;

    async function loadAdminData() {
      try {
        const [profile, dashboardData, contestHistoryData] = await Promise.all([
          getAdminProfile(),
          getAdminDashboardData(),
          getContestHistory(),
        ]);

        if (!mounted) return;

        setUser(profile);
        setSessionError("");

        setBusiness({
          name: dashboardData.business?.name || "",
          slug: dashboardData.business?.slug || "demo",
          publicUrl: dashboardData.business?.publicUrl || "",
          rut: dashboardData.business?.rut || "",
          address: dashboardData.business?.address || "",
          phone: dashboardData.business?.phone || "",
          email: dashboardData.business?.email || "",
          logoUrl: dashboardData.business?.logoUrl || "",
        });

        const normalizedContest = normalizeContest(dashboardData.contest);

        setContest(normalizedContest);
        setContestHistory(contestHistoryData || []);
        setPromotions(normalizePromotions(dashboardData.promotions));
        setSocialLinks(normalizeSocialLinks(dashboardData.socialLinks));
        setVisitsTotal(dashboardData.visits?.total || 0);
        setCustomers(dashboardData.customers || []);
        setPurchases(dashboardData.purchases || []);
        setAllPurchases(dashboardData.allPurchases || []);

        setPurchaseForm((current) => ({
          ...current,
          productName: normalizedContest.productName || "",
          manualPoints: normalizedContest.pointsPerPurchase || 1,
        }));
      } catch (error) {
        if (!mounted) return;

        setSessionError(error.message || "Sesión inválida");
        clearAdminSession();

        window.setTimeout(() => {
          navigate("/admin/login");
        }, 900);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadAdminData();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  function showSuccess(message) {
    setSuccessMessage(message);
    setErrorMessage("");

    window.setTimeout(() => {
      setSuccessMessage("");
    }, 3500);
  }

  function showError(message) {
    setErrorMessage(message);
    setSuccessMessage("");

    window.setTimeout(() => {
      setErrorMessage("");
    }, 4500);
  }

  function showPurchaseStatus(message, type) {
    setPurchaseStatusMessage(message);
    setPurchaseStatusType(type);
  }

  async function reloadCustomersAndPurchases() {
    const [updatedCustomers, currentPurchases, historicPurchases, history] =
      await Promise.all([
        getCustomers(customerSearch),
        getPurchases({ mode: "current" }),
        getPurchases({ mode: "all" }),
        getContestHistory(),
      ]);

    setCustomers(updatedCustomers);
    setPurchases(currentPurchases);
    setAllPurchases(historicPurchases);
    setContestHistory(history || []);
  }

  function handleLogout() {
    clearAdminSession();
    navigate("/admin/login");
  }

  function handleBusinessChange(field, value) {
    if (field === "slug") {
      return;
    }

    setBusiness((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSecurityChange(field, value) {
    setSecurityForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function closePinConfirmModal() {
    if (savingSecurity) {
      return;
    }

    setShowPinConfirmModal(false);
    setPinConfirmValue("");
    setPinModalError("");
  }

  function handleOpenPinConfirmModal(event) {
    event.preventDefault();

    const currentPassword = securityForm.currentPassword.trim();
    const newPassword = securityForm.newPassword.trim();
    const confirmPassword = securityForm.confirmPassword.trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
      showError(
        "Debes completar contraseña actual, nueva contraseña y confirmación."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      showError("La confirmación de contraseña no coincide.");
      return;
    }

    setPinModalError("");
    setPinConfirmValue("");
    setShowPinConfirmModal(true);
  }

  async function handleConfirmPasswordChangeWithPin() {
    if (savingSecurity) {
      return;
    }

    const currentPassword = securityForm.currentPassword.trim();
    const newPassword = securityForm.newPassword.trim();
    const confirmPassword = securityForm.confirmPassword.trim();
    const securityPin = pinConfirmValue.trim();

    if (!securityPin) {
      setPinModalError("Debes ingresar tu PIN para confirmar.");
      return;
    }

    if (!/^[0-9]{6}$/.test(securityPin)) {
      setPinModalError("El PIN debe tener exactamente 6 dígitos numéricos.");
      return;
    }

    setSavingSecurity(true);
    setPinModalError("");

    try {
      await changePasswordWithPin({
        currentPassword,
        newPassword,
        confirmPassword,
        securityPin,
      });

      setSecurityForm(emptySecurityForm);
      setPinConfirmValue("");
      setShowPinConfirmModal(false);
      setPinModalError("");
      setUser(getAdminUser());
      showSuccess("Contraseña actualizada correctamente.");
    } catch (error) {
      if (isBlockedByPinError(error)) {
        clearAdminSession();
        setShowPinConfirmModal(false);
        setPinConfirmValue("");
        setPinModalError("");
        setSessionError(
          "Usuario bloqueado por seguridad. Serás enviado al login para solicitar desbloqueo."
        );

        window.setTimeout(() => {
          navigate("/admin/login");
        }, 1200);

        return;
      }

      setPinModalError(
        error.message ||
          "No se pudo confirmar el cambio con el PIN de seguridad."
      );
    } finally {
      setSavingSecurity(false);
    }
  }

  async function handleCopyPublicLink() {
    if (!publicBusinessUrl) {
      showError("No hay link público disponible para copiar.");
      return;
    }

    try {
      await navigator.clipboard.writeText(publicBusinessUrl);
      showSuccess("Link público copiado correctamente.");
    } catch (error) {
      showError("No se pudo copiar el link. Copia manualmente la URL mostrada.");
    }
  }

  function handleContestChange(field, value) {
    setContest((current) => {
      if (field === "contestPeriod") {
        return {
          ...current,
          contestPeriod: value,
          endDate: getDefaultEndDateByPeriod(value),
        };
      }

      return {
        ...current,
        [field]: value,
      };
    });
  }

  function handlePromotionChange(index, field, value) {
    setPromotions((current) =>
      current.map((promotion, promotionIndex) =>
        promotionIndex === index
          ? {
              ...promotion,
              [field]: value,
            }
          : promotion
      )
    );
  }

  function handlePromotionActiveChange(index, checked) {
    setPromotions((current) =>
      current.map((promotion, promotionIndex) =>
        promotionIndex === index
          ? {
              ...promotion,
              active: checked,
            }
          : promotion
      )
    );
  }

  function handleSocialChange(index, field, value) {
    setSocialLinks((current) =>
      current.map((social, socialIndex) =>
        socialIndex === index
          ? {
              ...social,
              [field]: value,
            }
          : social
      )
    );
  }

  function handleSocialActiveChange(index, checked) {
    setSocialLinks((current) =>
      current.map((social, socialIndex) =>
        socialIndex === index
          ? {
              ...social,
              active: checked,
            }
          : social
      )
    );
  }

  function handleCustomerFormChange(field, value) {
    setCustomerForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handlePurchaseFormChange(field, value) {
    setPurchaseForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleEditCustomer(customer) {
    setCustomerForm({
      id: customer.id,
      name: customer.name || "",
      rut: customer.rut || "",
      phone: customer.phone || "",
      email: customer.email || "",
      notes: customer.notes || "",
      active: Boolean(customer.active),
    });

    setPurchaseForm((current) => ({
      ...current,
      customerRut: customer.rut || "",
      customerName: customer.name || "",
      customerPhone: customer.phone || "",
      customerEmail: customer.email || "",
    }));

    setActiveTab("customers-purchases");
  }

  async function handleSearchCustomers(event) {
    event.preventDefault();

    try {
      const results = await getCustomers(customerSearch);
      setCustomers(results);
    } catch (error) {
      showError(error.message || "No se pudo buscar clientes.");
    }
  }

  async function handleSaveBusiness(event) {
    event.preventDefault();

    setSavingBusiness(true);

    try {
      const updatedBusiness = await updateBusiness({
        name: business.name,
        rut: business.rut,
        address: business.address,
        phone: business.phone,
        email: business.email,
        logoUrl: business.logoUrl,
      });

      setBusiness((current) => ({
        ...current,
        name: updatedBusiness.name || "",
        slug: updatedBusiness.slug || current.slug || "",
        publicUrl: updatedBusiness.publicUrl || current.publicUrl || "",
        rut: updatedBusiness.rut || "",
        address: updatedBusiness.address || "",
        phone: updatedBusiness.phone || "",
        email: updatedBusiness.email || "",
        logoUrl: updatedBusiness.logoUrl || "",
      }));

      showSuccess("Datos del negocio actualizados correctamente.");
    } catch (error) {
      showError(error.message || "No se pudo actualizar el negocio.");
    } finally {
      setSavingBusiness(false);
    }
  }

  async function handleLogoUpload(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploadingLogo(true);

    try {
      const result = await uploadBusinessLogo(file);

      setBusiness((current) => ({
        ...current,
        logoUrl: result.logoUrl,
      }));

      showSuccess("Logo subido correctamente.");
    } catch (error) {
      showError(error.message || "No se pudo subir el logo.");
    } finally {
      setUploadingLogo(false);
      event.target.value = "";
    }
  }

  async function handleSaveContest(event) {
    event.preventDefault();

    setSavingContest(true);

    try {
      const updatedContest = await updateContest({
        ...contest,
        minimumPurchaseAmount: Number(contest.minimumPurchaseAmount || 0),
        minimumPurchaseKg: Number(contest.minimumPurchaseKg || 0),
        pointsPerPurchase: Number(contest.pointsPerPurchase || 1),
        targetPoints: Number(contest.targetPoints || 0),
      });

      const normalizedContest = normalizeContest(updatedContest);

      setContest(normalizedContest);
      setPurchaseForm((current) => ({
        ...current,
        productName: normalizedContest.productName || "",
        manualPoints: normalizedContest.pointsPerPurchase || 1,
      }));

      showSuccess("Concurso actualizado correctamente.");
    } catch (error) {
      showError(error.message || "No se pudo actualizar el concurso.");
    } finally {
      setSavingContest(false);
    }
  }

  async function handleCreateNextContest() {
    const confirmed = window.confirm(
      "¿Deseas iniciar un próximo sorteo? El concurso actual quedará guardado y se creará uno nuevo activo. El historial y el ganador anterior no se borrarán."
    );

    if (!confirmed) {
      return;
    }

    setSavingNextContest(true);

    try {
      const nextContestDraft = buildNextContestDraft(contest);

      const createdContest = await createNextContest({
        ...nextContestDraft,
        minimumPurchaseAmount: Number(
          nextContestDraft.minimumPurchaseAmount || 0
        ),
        minimumPurchaseKg: Number(nextContestDraft.minimumPurchaseKg || 0),
        pointsPerPurchase: Number(nextContestDraft.pointsPerPurchase || 1),
        targetPoints: Number(nextContestDraft.targetPoints || 0),
      });

      const normalizedContest = normalizeContest(createdContest);

      setContest(normalizedContest);
      setPurchaseForm({
        ...emptyPurchaseForm,
        productName: normalizedContest.productName || "",
        manualPoints: normalizedContest.pointsPerPurchase || 1,
      });

      await reloadCustomersAndPurchases();

      showSuccess("Próximo sorteo iniciado correctamente.");
    } catch (error) {
      showError(error.message || "No se pudo iniciar el próximo sorteo.");
    } finally {
      setSavingNextContest(false);
    }
  }

  async function handleSavePromotions(event) {
    event.preventDefault();

    setSavingPromotions(true);

    try {
      const updatedPromotions = await updatePromotions(promotions);

      setPromotions(normalizePromotions(updatedPromotions));
      showSuccess("Promociones actualizadas correctamente.");
    } catch (error) {
      showError(error.message || "No se pudieron actualizar las promociones.");
    } finally {
      setSavingPromotions(false);
    }
  }

  async function handleSaveSocialLinks(event) {
    event.preventDefault();

    setSavingSocialLinks(true);

    try {
      const updatedSocialLinks = await updateSocialLinks(socialLinks);

      setSocialLinks(normalizeSocialLinks(updatedSocialLinks));
      showSuccess("Redes sociales actualizadas correctamente.");
    } catch (error) {
      showError(error.message || "No se pudieron actualizar las redes sociales.");
    } finally {
      setSavingSocialLinks(false);
    }
  }

  async function handleSaveCustomer(event) {
    event.preventDefault();

    setSavingCustomer(true);

    try {
      if (customerForm.id) {
        await updateCustomer(customerForm.id, customerForm);
        showSuccess("Cliente actualizado correctamente.");
      } else {
        await createCustomer(customerForm);
        showSuccess("Cliente creado correctamente.");
      }

      setCustomerForm(emptyCustomerForm);
      await reloadCustomersAndPurchases();
    } catch (error) {
      showError(error.message || "No se pudo guardar el cliente.");
    } finally {
      setSavingCustomer(false);
    }
  }

  async function handleRegisterPurchase() {
    if (savingPurchase) {
      return;
    }

    showPurchaseStatus("Enviando compra al backend...", "info");

    const customerRut = String(purchaseForm.customerRut || "").trim();
    const customerName = String(purchaseForm.customerName || "").trim();
    const customerPhone = String(purchaseForm.customerPhone || "").trim();
    const customerEmail = String(purchaseForm.customerEmail || "").trim();
    const ticketNumber = String(purchaseForm.ticketNumber || "").trim();
    const productName = String(
      purchaseForm.productName || contest.productName || ""
    ).trim();
    const totalAmount = Number(purchaseForm.totalAmount || 0);
    const totalKg = Number(purchaseForm.totalKg || 0);
    const manualPoints = Number(
      purchaseForm.manualPoints || contest.pointsPerPurchase || 1
    );

    if (!customerRut) {
      showPurchaseStatus("Error: debes ingresar el RUT del cliente.", "error");
      showError("Debes ingresar el RUT del cliente.");
      return;
    }

    if (!ticketNumber) {
      showPurchaseStatus("Error: debes ingresar el número de boleta.", "error");
      showError("Debes ingresar el número de boleta.");
      return;
    }

    if (!manualPoints || manualPoints <= 0) {
      showPurchaseStatus("Error: los puntos deben ser mayores a cero.", "error");
      showError("Los puntos a sumar deben ser mayores a cero.");
      return;
    }

    setSavingPurchase(true);

    try {
      const purchasePayload = {
        customerRut,
        customerName,
        customerPhone,
        customerEmail,
        ticketNumber,
        productName,
        totalAmount,
        totalKg,
        manualPoints,
      };

      const createdPurchase = await registerPurchase(purchasePayload);

      setPurchaseForm({
        ...emptyPurchaseForm,
        productName: contest.productName || "",
        manualPoints: contest.pointsPerPurchase || 1,
      });

      await reloadCustomersAndPurchases();

      showPurchaseStatus(
        `Compra registrada correctamente. Boleta ${
          createdPurchase?.ticketNumber || ticketNumber
        }, ${createdPurchase?.pointsGenerated || manualPoints} puntos.`,
        "success"
      );

      showSuccess("Compra registrada y puntos sumados correctamente.");
    } catch (error) {
      showPurchaseStatus(
        `Error al registrar compra: ${error.message || "Error desconocido"}`,
        "error"
      );

      showError(error.message || "No se pudo registrar la compra.");
    } finally {
      setSavingPurchase(false);
    }
  }

  return (
    <main className="admin-dashboard-page">
      <header className="admin-dashboard-header">
        <div>
          <span>Panel administrador</span>
          <h1>KLIENTE</h1>
        </div>

        <div className="admin-dashboard-user">
          <div>
            <strong>{user?.name || "Administrador"}</strong>
            <small>{user?.email || "admin@kliente.cl"}</small>
          </div>

          <button type="button" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      {loading && <div className="admin-dashboard-alert">Cargando panel...</div>}

      {sessionError && (
        <div className="admin-dashboard-alert admin-dashboard-alert-error">
          {sessionError}
        </div>
      )}

      {successMessage && (
        <div className="admin-dashboard-alert admin-dashboard-alert-success">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="admin-dashboard-alert admin-dashboard-alert-error">
          {errorMessage}
        </div>
      )}

      <section className="admin-dashboard-hero">
        <div>
          <span>Administración activa</span>
          <h2>Panel de control del negocio</h2>
          <p>
            Edita el concurso, registra clientes, ingresa compras con boleta,
            administra promociones y ejecuta ciclos de nuevos sorteos.
          </p>
        </div>

        <a href={publicScreenUrl} target="_blank" rel="noreferrer">
          Ver pantalla pública
        </a>
      </section>

      <section className="admin-stats-grid">
        <article className="admin-stat-card">
          <span>Visitas página pública</span>
          <strong>{visitsTotal}</strong>
          <small>Total acumulado de visitas al sitio público.</small>
        </article>

        <article className="admin-stat-card">
          <span>Clientes registrados</span>
          <strong>{customers.length}</strong>
          <small>Clientes visibles en la base del negocio.</small>
        </article>

        <article className="admin-stat-card">
          <span>Compras sorteo actual</span>
          <strong>{purchases.length}</strong>
          <small>Compras registradas solo en el sorteo activo.</small>
        </article>
      </section>

      <nav className="admin-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? "admin-tab active" : "admin-tab"}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === "business" && (
        <section className="admin-tab-panel">
          <form className="admin-editor-card" onSubmit={handleSaveBusiness}>
            <div className="admin-editor-card-header">
              <div>
                <span>Configuración negocio</span>
                <h3>Datos del local</h3>
              </div>
            </div>

            <div className="admin-logo-area">
              <div className="admin-logo-preview">
                {logoPreviewUrl ? (
                  <img src={logoPreviewUrl} alt="Logo del negocio" />
                ) : (
                  <strong>Sin logo</strong>
                )}
              </div>

              <label className="admin-logo-upload">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleLogoUpload}
                  disabled={uploadingLogo}
                />
                {uploadingLogo ? "Subiendo logo..." : "Subir logo"}
              </label>
            </div>

            <div className="admin-form-grid">
              <label>
                Nombre del negocio
                <input
                  type="text"
                  value={business.name}
                  onChange={(event) =>
                    handleBusinessChange("name", event.target.value)
                  }
                  required
                />
              </label>

              <label>
                RUT
                <input
                  type="text"
                  value={business.rut}
                  onChange={(event) =>
                    handleBusinessChange("rut", event.target.value)
                  }
                  placeholder="76.000.000-0"
                />
              </label>

              <label className="admin-form-full">
                Link público para compartir
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <input type="text" value={publicBusinessUrl} readOnly />

                  <button
                    className="admin-secondary-button"
                    type="button"
                    onClick={handleCopyPublicLink}
                  >
                    Copiar link
                  </button>
                </div>
                <small>
                  Este link lo genera Mitnick Connect. El comercio solo puede
                  copiarlo y compartirlo con sus clientes.
                </small>
              </label>

              <label>
                Teléfono
                <input
                  type="text"
                  value={business.phone}
                  onChange={(event) =>
                    handleBusinessChange("phone", event.target.value)
                  }
                />
              </label>

              <label>
                Correo
                <input
                  type="email"
                  value={business.email}
                  onChange={(event) =>
                    handleBusinessChange("email", event.target.value)
                  }
                />
              </label>

              <label className="admin-form-full">
                Dirección
                <input
                  type="text"
                  value={business.address}
                  onChange={(event) =>
                    handleBusinessChange("address", event.target.value)
                  }
                />
              </label>
            </div>

            <button
              className="admin-primary-button"
              type="submit"
              disabled={savingBusiness}
            >
              {savingBusiness ? "Guardando..." : "Guardar negocio"}
            </button>
          </form>
        </section>
      )}

      {activeTab === "security" && (
        <section className="admin-tab-panel">
          <form
            className="admin-editor-card"
            onSubmit={handleOpenPinConfirmModal}
            style={{
              maxWidth: 760,
              margin: "0 auto",
            }}
          >
            <div className="admin-editor-card-header">
              <div>
                <span>Seguridad de cuenta</span>
                <h3>Cambiar contraseña</h3>
              </div>
            </div>

            <div
              style={{
                marginBottom: 22,
                padding: "14px 16px",
                borderRadius: 16,
                background: "rgba(59, 130, 246, 0.14)",
                border: "1px solid rgba(59, 130, 246, 0.34)",
                color: "#dbeafe",
                fontWeight: 800,
                lineHeight: 1.45,
              }}
            >
              Ingresa tu contraseña actual y tu nueva contraseña. Al continuar,
              se abrirá una confirmación para validar el cambio con tu PIN de
              seguridad.
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: 18,
              }}
            >
              <label style={securityLabelStyle}>
                Contraseña actual
                <input
                  style={securityInputStyle}
                  type="password"
                  value={securityForm.currentPassword}
                  onChange={(event) =>
                    handleSecurityChange("currentPassword", event.target.value)
                  }
                  autoComplete="current-password"
                  required
                />
              </label>

              <label style={securityLabelStyle}>
                Nueva contraseña
                <input
                  style={securityInputStyle}
                  type="password"
                  value={securityForm.newPassword}
                  onChange={(event) =>
                    handleSecurityChange("newPassword", event.target.value)
                  }
                  autoComplete="new-password"
                  required
                />
                <small
                  style={{
                    color: "rgba(255,255,255,0.68)",
                    fontWeight: 800,
                    lineHeight: 1.35,
                  }}
                >
                  Debe tener mínimo 8 caracteres, una mayúscula, una minúscula y
                  un número.
                </small>
              </label>

              <label style={securityLabelStyle}>
                Confirmar nueva contraseña
                <input
                  style={securityInputStyle}
                  type="password"
                  value={securityForm.confirmPassword}
                  onChange={(event) =>
                    handleSecurityChange("confirmPassword", event.target.value)
                  }
                  autoComplete="new-password"
                  required
                />
              </label>
            </div>

            <button
              className="admin-primary-button"
              type="submit"
              disabled={savingSecurity}
              style={{
                marginTop: 22,
                width: "100%",
              }}
            >
              {savingSecurity ? "Procesando..." : "Guardar cambio de contraseña"}
            </button>
          </form>
        </section>
      )}

      {activeTab === "contest" && (
        <section className="admin-tab-panel">
          <form className="admin-editor-card" onSubmit={handleSaveContest}>
            <div className="admin-editor-card-header">
              <div>
                <span>Configuración sorteo</span>
                <h3>Concurso del negocio</h3>
              </div>

              <button
                className="admin-secondary-button"
                type="button"
                onClick={handleCreateNextContest}
                disabled={savingNextContest}
              >
                {savingNextContest
                  ? "Iniciando próximo sorteo..."
                  : "Iniciar próximo sorteo"}
              </button>
            </div>

            <div className="admin-form-grid">
              <label>
                Tipo de concurso
                <select
                  value={contest.contestPeriod}
                  onChange={(event) =>
                    handleContestChange("contestPeriod", event.target.value)
                  }
                >
                  <option value="weekly">Semanal</option>
                  <option value="biweekly">Quincenal</option>
                  <option value="monthly">Mensual</option>
                  <option value="custom">Personalizado</option>
                </select>
              </label>

              <label>
                Estado
                <select
                  value={contest.status}
                  onChange={(event) =>
                    handleContestChange("status", event.target.value)
                  }
                >
                  <option value="draft">Borrador</option>
                  <option value="active">Activo</option>
                  <option value="finished">Finalizado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </label>

              <label className="admin-form-full">
                Título
                <input
                  type="text"
                  value={contest.title}
                  onChange={(event) =>
                    handleContestChange("title", event.target.value)
                  }
                  required
                />
              </label>

              <label className="admin-form-full">
                Descripción
                <textarea
                  rows={3}
                  value={contest.description}
                  onChange={(event) =>
                    handleContestChange("description", event.target.value)
                  }
                />
              </label>

              <label>
                Premio
                <input
                  type="text"
                  value={contest.prizeTitle}
                  onChange={(event) =>
                    handleContestChange("prizeTitle", event.target.value)
                  }
                  required
                />
              </label>

              <label>
                Producto del concurso
                <input
                  type="text"
                  value={contest.productName}
                  onChange={(event) =>
                    handleContestChange("productName", event.target.value)
                  }
                  placeholder="Ej: Pan, hallulla, marraqueta"
                />
              </label>

              <label>
                Inicio
                <input
                  type="datetime-local"
                  value={contest.startDate}
                  onChange={(event) =>
                    handleContestChange("startDate", event.target.value)
                  }
                  required
                />
              </label>

              <label>
                Término
                <input
                  type="datetime-local"
                  value={contest.endDate}
                  onChange={(event) =>
                    handleContestChange("endDate", event.target.value)
                  }
                  required
                />
              </label>

              <label>
                Puntos por compra
                <input
                  type="number"
                  min="1"
                  value={contest.pointsPerPurchase}
                  onChange={(event) =>
                    handleContestChange("pointsPerPurchase", event.target.value)
                  }
                />
              </label>

              <label>
                Meta puntos sorteo
                <input
                  type="number"
                  min="0"
                  value={contest.targetPoints}
                  onChange={(event) =>
                    handleContestChange("targetPoints", event.target.value)
                  }
                />
              </label>

              <label>
                Monto mínimo
                <input
                  type="number"
                  min="0"
                  value={contest.minimumPurchaseAmount}
                  onChange={(event) =>
                    handleContestChange(
                      "minimumPurchaseAmount",
                      event.target.value
                    )
                  }
                />
              </label>

              <label>
                Kilos mínimos
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={contest.minimumPurchaseKg}
                  onChange={(event) =>
                    handleContestChange("minimumPurchaseKg", event.target.value)
                  }
                />
              </label>

              <label className="admin-form-full">
                Descripción del premio
                <textarea
                  rows={2}
                  value={contest.prizeDescription}
                  onChange={(event) =>
                    handleContestChange("prizeDescription", event.target.value)
                  }
                />
              </label>
            </div>

            <button
              className="admin-primary-button"
              type="submit"
              disabled={savingContest}
            >
              {savingContest ? "Guardando..." : "Guardar concurso"}
            </button>

            <AdminWinnerBox />
          </form>
        </section>
      )}

      {activeTab === "promotions" && (
        <section className="admin-tab-panel">
          <form className="admin-editor-card" onSubmit={handleSavePromotions}>
            <div className="admin-editor-card-header">
              <div>
                <span>Promociones</span>
                <h3>5 promociones visibles en pantalla</h3>
              </div>
            </div>

            <div className="admin-promotions-grid">
              {promotions.map((promotion, index) => (
                <article
                  className="admin-repeat-item"
                  key={promotion.id || index}
                >
                  <div className="admin-repeat-title">
                    <strong>Promoción {index + 1}</strong>

                    <label className="admin-check">
                      <input
                        type="checkbox"
                        checked={promotion.active}
                        onChange={(event) =>
                          handlePromotionActiveChange(
                            index,
                            event.target.checked
                          )
                        }
                      />
                      Activa
                    </label>
                  </div>

                  <div className="admin-form-grid">
                    <label>
                      Título
                      <input
                        type="text"
                        value={promotion.title}
                        onChange={(event) =>
                          handlePromotionChange(
                            index,
                            "title",
                            event.target.value
                          )
                        }
                        required
                      />
                    </label>

                    <label>
                      Etiqueta
                      <input
                        type="text"
                        value={promotion.tag}
                        onChange={(event) =>
                          handlePromotionChange(
                            index,
                            "tag",
                            event.target.value
                          )
                        }
                      />
                    </label>

                    <label className="admin-form-full">
                      Descripción
                      <textarea
                        value={promotion.description}
                        onChange={(event) =>
                          handlePromotionChange(
                            index,
                            "description",
                            event.target.value
                          )
                        }
                        rows={3}
                      />
                    </label>
                  </div>
                </article>
              ))}
            </div>

            <button
              className="admin-primary-button"
              type="submit"
              disabled={savingPromotions}
            >
              {savingPromotions ? "Guardando..." : "Guardar promociones"}
            </button>
          </form>
        </section>
      )}

      {activeTab === "customers-purchases" && (
        <section className="admin-tab-panel">
          <div className="admin-editor-grid">
            <form className="admin-editor-card" onSubmit={handleSaveCustomer}>
              <div className="admin-editor-card-header">
                <div>
                  <span>Clientes</span>
                  <h3>{customerForm.id ? "Editar cliente" : "Crear cliente"}</h3>
                </div>

                {customerForm.id && (
                  <button
                    className="admin-secondary-button"
                    type="button"
                    onClick={() => setCustomerForm(emptyCustomerForm)}
                  >
                    Nuevo cliente
                  </button>
                )}
              </div>

              <div className="admin-form-grid">
                <label>
                  RUT
                  <input
                    type="text"
                    value={customerForm.rut}
                    onChange={(event) =>
                      handleCustomerFormChange("rut", event.target.value)
                    }
                  />
                </label>

                <label>
                  Nombre
                  <input
                    type="text"
                    value={customerForm.name}
                    onChange={(event) =>
                      handleCustomerFormChange("name", event.target.value)
                    }
                  />
                </label>

                <label>
                  Teléfono
                  <input
                    type="text"
                    value={customerForm.phone}
                    onChange={(event) =>
                      handleCustomerFormChange("phone", event.target.value)
                    }
                  />
                </label>

                <label>
                  Correo
                  <input
                    type="email"
                    value={customerForm.email}
                    onChange={(event) =>
                      handleCustomerFormChange("email", event.target.value)
                    }
                  />
                </label>

                <label className="admin-form-full">
                  Notas
                  <textarea
                    rows={2}
                    value={customerForm.notes}
                    onChange={(event) =>
                      handleCustomerFormChange("notes", event.target.value)
                    }
                  />
                </label>
              </div>

              <button
                className="admin-primary-button"
                type="submit"
                disabled={savingCustomer}
              >
                {savingCustomer ? "Guardando..." : "Guardar cliente"}
              </button>
            </form>

            <div className="admin-editor-card">
              <div className="admin-editor-card-header">
                <div>
                  <span>Compras sorteo actual</span>
                  <h3>Registrar compra / boleta</h3>
                </div>
              </div>

              {purchaseStatusMessage && (
                <div
                  style={{
                    marginBottom: 14,
                    padding: "12px 14px",
                    borderRadius: 14,
                    fontWeight: 900,
                    color: "#ffffff",
                    background:
                      purchaseStatusType === "success"
                        ? "rgba(34, 197, 94, 0.24)"
                        : purchaseStatusType === "error"
                          ? "rgba(239, 68, 68, 0.24)"
                          : "rgba(59, 130, 246, 0.24)",
                    border:
                      purchaseStatusType === "success"
                        ? "1px solid rgba(34, 197, 94, 0.45)"
                        : purchaseStatusType === "error"
                          ? "1px solid rgba(239, 68, 68, 0.45)"
                          : "1px solid rgba(59, 130, 246, 0.45)",
                  }}
                >
                  {purchaseStatusMessage}
                </div>
              )}

              <div className="admin-form-grid">
                <label>
                  RUT cliente
                  <input
                    type="text"
                    value={purchaseForm.customerRut}
                    onChange={(event) =>
                      handlePurchaseFormChange("customerRut", event.target.value)
                    }
                  />
                </label>

                <label>
                  Nombre si es nuevo
                  <input
                    type="text"
                    value={purchaseForm.customerName}
                    onChange={(event) =>
                      handlePurchaseFormChange(
                        "customerName",
                        event.target.value
                      )
                    }
                  />
                </label>

                <label>
                  Teléfono
                  <input
                    type="text"
                    value={purchaseForm.customerPhone}
                    onChange={(event) =>
                      handlePurchaseFormChange(
                        "customerPhone",
                        event.target.value
                      )
                    }
                  />
                </label>

                <label>
                  Número de boleta
                  <input
                    type="text"
                    value={purchaseForm.ticketNumber}
                    onChange={(event) =>
                      handlePurchaseFormChange(
                        "ticketNumber",
                        event.target.value
                      )
                    }
                  />
                </label>

                <label>
                  Producto comprado
                  <input
                    type="text"
                    value={purchaseForm.productName}
                    onChange={(event) =>
                      handlePurchaseFormChange(
                        "productName",
                        event.target.value
                      )
                    }
                    placeholder={contest.productName || "Producto del concurso"}
                  />
                </label>

                <label>
                  Puntos a sumar
                  <input
                    type="number"
                    min="1"
                    value={purchaseForm.manualPoints}
                    onChange={(event) =>
                      handlePurchaseFormChange(
                        "manualPoints",
                        event.target.value
                      )
                    }
                    placeholder={contest.pointsPerPurchase || 1}
                  />
                </label>

                <label>
                  Monto compra
                  <input
                    type="number"
                    min="0"
                    value={purchaseForm.totalAmount}
                    onChange={(event) =>
                      handlePurchaseFormChange(
                        "totalAmount",
                        event.target.value
                      )
                    }
                  />
                </label>

                <label>
                  Kilos comprados
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={purchaseForm.totalKg}
                    onChange={(event) =>
                      handlePurchaseFormChange("totalKg", event.target.value)
                    }
                  />
                </label>
              </div>

              <button
                className="admin-primary-button"
                type="button"
                onClick={handleRegisterPurchase}
                style={{
                  opacity: savingPurchase ? 0.75 : 1,
                  cursor: savingPurchase ? "wait" : "pointer",
                }}
              >
                {savingPurchase
                  ? "Registrando..."
                  : "Registrar compra y sumar puntos"}
              </button>
            </div>
          </div>
        </section>
      )}

      {activeTab === "customers" && (
        <section className="admin-tab-panel">
          <div className="admin-editor-card">
            <div className="admin-editor-card-header">
              <div>
                <span>Base de clientes</span>
                <h3>Buscar clientes por RUT, nombre, teléfono o correo</h3>
              </div>
            </div>

            <form className="admin-search-row" onSubmit={handleSearchCustomers}>
              <input
                type="text"
                value={customerSearch}
                onChange={(event) => setCustomerSearch(event.target.value)}
                placeholder="Buscar por RUT, nombre, teléfono o correo"
              />

              <button type="submit">Buscar</button>
            </form>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>RUT</th>
                    <th>Teléfono</th>
                    <th>Puntos sorteo actual</th>
                    <th>Puntos históricos</th>
                    <th>Estado</th>
                    <th>Acción</th>
                  </tr>
                </thead>

                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id}>
                      <td>{customer.name}</td>
                      <td>{customer.rut}</td>
                      <td>{customer.phone || "-"}</td>
                      <td>{customer.currentContestPoints || 0}</td>
                      <td>{customer.totalPoints || 0}</td>
                      <td>{customer.active ? "Activo" : "Inactivo"}</td>
                      <td>
                        <button
                          className="admin-table-button"
                          type="button"
                          onClick={() => handleEditCustomer(customer)}
                        >
                          Editar / usar
                        </button>
                      </td>
                    </tr>
                  ))}

                  {!customers.length && (
                    <tr>
                      <td colSpan="7">No hay clientes para mostrar.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {activeTab === "social" && (
        <section className="admin-tab-panel">
          <form className="admin-editor-card" onSubmit={handleSaveSocialLinks}>
            <div className="admin-editor-card-header">
              <div>
                <span>Redes sociales</span>
                <h3>Enlaces visibles y códigos QR</h3>
              </div>
            </div>

            <div className="admin-repeat-list">
              {socialLinks.map((social, index) => (
                <article className="admin-repeat-item" key={social.id || index}>
                  <div className="admin-repeat-title">
                    <strong>Red social {index + 1}</strong>

                    <label className="admin-check">
                      <input
                        type="checkbox"
                        checked={social.active}
                        onChange={(event) =>
                          handleSocialActiveChange(index, event.target.checked)
                        }
                      />
                      Activa
                    </label>
                  </div>

                  <div className="admin-form-grid">
                    <label>
                      Nombre
                      <input
                        type="text"
                        value={social.name}
                        onChange={(event) =>
                          handleSocialChange(index, "name", event.target.value)
                        }
                      />
                    </label>

                    <label>
                      Etiqueta
                      <input
                        type="text"
                        value={social.label}
                        onChange={(event) =>
                          handleSocialChange(index, "label", event.target.value)
                        }
                      />
                    </label>

                    <label className="admin-form-full">
                      URL para QR
                      <input
                        type="url"
                        value={social.url}
                        onChange={(event) =>
                          handleSocialChange(index, "url", event.target.value)
                        }
                      />
                    </label>
                  </div>
                </article>
              ))}
            </div>

            <button
              className="admin-primary-button"
              type="submit"
              disabled={savingSocialLinks}
            >
              {savingSocialLinks ? "Guardando..." : "Guardar redes sociales"}
            </button>
          </form>
        </section>
      )}

      {activeTab === "history" && (
        <section className="admin-tab-panel">
          <div className="admin-editor-card">
            <div className="admin-editor-card-header">
              <div>
                <span>Historial</span>
                <h3>Compras del sorteo actual</h3>
              </div>
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Boleta</th>
                    <th>Cliente</th>
                    <th>RUT</th>
                    <th>Producto</th>
                    <th>Monto</th>
                    <th>Kilos</th>
                    <th>Puntos</th>
                  </tr>
                </thead>

                <tbody>
                  {purchases.map((purchase) => (
                    <tr key={purchase.id}>
                      <td>{purchase.ticketNumber}</td>
                      <td>{purchase.customerName}</td>
                      <td>{purchase.customerRut}</td>
                      <td>{purchase.productName || "-"}</td>
                      <td>{formatMoney(purchase.totalAmount)}</td>
                      <td>{purchase.totalKg || 0}</td>
                      <td>{purchase.pointsGenerated}</td>
                    </tr>
                  ))}

                  {!purchases.length && (
                    <tr>
                      <td colSpan="7">
                        No hay compras registradas para el sorteo actual.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="admin-editor-card" style={{ marginTop: 18 }}>
            <div className="admin-editor-card-header">
              <div>
                <span>Historial completo</span>
                <h3>Todas las compras registradas</h3>
              </div>
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Concurso</th>
                    <th>Boleta</th>
                    <th>Cliente</th>
                    <th>RUT</th>
                    <th>Producto</th>
                    <th>Monto</th>
                    <th>Kilos</th>
                    <th>Puntos</th>
                  </tr>
                </thead>

                <tbody>
                  {allPurchases.map((purchase) => (
                    <tr key={purchase.id}>
                      <td>{purchase.contestTitle || "-"}</td>
                      <td>{purchase.ticketNumber}</td>
                      <td>{purchase.customerName}</td>
                      <td>{purchase.customerRut}</td>
                      <td>{purchase.productName || "-"}</td>
                      <td>{formatMoney(purchase.totalAmount)}</td>
                      <td>{purchase.totalKg || 0}</td>
                      <td>{purchase.pointsGenerated}</td>
                    </tr>
                  ))}

                  {!allPurchases.length && (
                    <tr>
                      <td colSpan="8">No hay historial de compras.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {activeTab === "contest-history" && (
        <section className="admin-tab-panel">
          <div className="admin-editor-card">
            <div className="admin-editor-card-header">
              <div>
                <span>Sorteos y ganadores</span>
                <h3>Historial de concursos del negocio</h3>
              </div>
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Concurso</th>
                    <th>Estado</th>
                    <th>Inicio</th>
                    <th>Término</th>
                    <th>Compras</th>
                    <th>Participantes</th>
                    <th>Puntos</th>
                    <th>Ganador</th>
                    <th>RUT ganador</th>
                  </tr>
                </thead>

                <tbody>
                  {contestHistory.map((item) => (
                    <tr key={item.contestId}>
                      <td>
                        <strong>{item.title}</strong>
                        <br />
                        <small>{item.prizeTitle || "-"}</small>
                      </td>
                      <td>{formatContestStatus(item.status)}</td>
                      <td>{formatDateTime(item.startDate)}</td>
                      <td>{formatDateTime(item.endDate)}</td>
                      <td>{item.purchasesCount}</td>
                      <td>{item.participantsCount}</td>
                      <td>{item.totalPoints}</td>
                      <td>
                        {item.winner ? (
                          <>
                            <strong>{item.winner.customerName}</strong>
                            <br />
                            <small>{item.winner.totalPoints} pts</small>
                          </>
                        ) : (
                          "Sin ganador"
                        )}
                      </td>
                      <td>{item.winner?.customerRut || "-"}</td>
                    </tr>
                  ))}

                  {!contestHistory.length && (
                    <tr>
                      <td colSpan="9">No hay sorteos registrados.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {showPinConfirmModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(2, 6, 23, 0.72)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            zIndex: 9999,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 460,
              borderRadius: 24,
              padding: 24,
              background:
                "linear-gradient(145deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.98))",
              border: "1px solid rgba(148, 163, 184, 0.28)",
              boxShadow: "0 28px 70px rgba(0,0,0,0.45)",
            }}
          >
            <div style={{ marginBottom: 16 }}>
              <span
                style={{
                  display: "inline-block",
                  marginBottom: 8,
                  padding: "6px 12px",
                  borderRadius: 999,
                  background: "rgba(59, 130, 246, 0.18)",
                  color: "#dbeafe",
                  fontSize: 12,
                  fontWeight: 900,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                Confirmación de seguridad
              </span>

              <h3
                style={{
                  margin: 0,
                  color: "#ffffff",
                  fontSize: "1.5rem",
                  lineHeight: 1.1,
                  fontWeight: 1000,
                }}
              >
                Confirmar con tu PIN
              </h3>

              <p
                style={{
                  margin: "10px 0 0",
                  color: "rgba(255,255,255,0.82)",
                  lineHeight: 1.5,
                  fontWeight: 700,
                }}
              >
                Para terminar el cambio de contraseña, ingresa tu PIN de
                seguridad de 6 dígitos.
              </p>
            </div>

            <label
              style={{
                display: "grid",
                gap: 8,
                color: "#ffffff",
                fontWeight: 900,
                marginBottom: 14,
              }}
            >
              PIN de seguridad
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                autoFocus
                value={pinConfirmValue}
                onChange={(event) => setPinConfirmValue(event.target.value)}
                placeholder="Ingresa tu PIN"
                style={{
                  width: "100%",
                  border: "1px solid rgba(148, 163, 184, 0.38)",
                  borderRadius: 16,
                  padding: "14px 16px",
                  background: "rgba(15, 23, 42, 0.82)",
                  color: "#ffffff",
                  outline: "none",
                  fontSize: "1rem",
                  fontWeight: 800,
                }}
              />
            </label>

            {pinModalError && (
              <div
                style={{
                  marginBottom: 14,
                  padding: "12px 14px",
                  borderRadius: 14,
                  background: "rgba(239, 68, 68, 0.20)",
                  border: "1px solid rgba(248, 113, 113, 0.42)",
                  color: "#fecaca",
                  fontWeight: 900,
                }}
              >
                {pinModalError}
              </div>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <button
                type="button"
                onClick={closePinConfirmModal}
                disabled={savingSecurity}
                style={{
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: 16,
                  padding: "14px 16px",
                  background: "rgba(15, 23, 42, 0.72)",
                  color: "#ffffff",
                  fontWeight: 900,
                  cursor: savingSecurity ? "wait" : "pointer",
                }}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmPasswordChangeWithPin}
                disabled={savingSecurity}
                style={{
                  border: 0,
                  borderRadius: 16,
                  padding: "14px 16px",
                  background: "linear-gradient(135deg, #f59e0b, #fde047)",
                  color: "#713f12",
                  fontWeight: 1000,
                  cursor: savingSecurity ? "wait" : "pointer",
                  boxShadow: "0 16px 32px rgba(245, 158, 11, 0.22)",
                }}
              >
                {savingSecurity ? "Confirmando..." : "Confirmar cambio"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}