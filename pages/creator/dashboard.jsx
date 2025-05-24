import React, { useState, useEffect } from 'react'; // Ensure useEffect is imported
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext'; // Adjust path as necessary
import DashboardLayout from '../../../layouts/DashboardLayout';
import Sidebar from '../../../components/Sidebar';
import StatCard from '../../../components/StatCard';
import ActivityFeed from '../../../components/ActivityFeed';
import Table from '../../../components/Table';
import Pagination from '../../../components/Pagination';
import Badge from '../../../components/Badge';
import Button from '../../../components/Button';
import withAuth from '../../../components/withAuth'; // Import withAuth

const CreatorDashboard = () => {
  const { user: loggedInUser, token } = useAuth(); // Get loggedInUser (contains role, id) and token

  const [stats, setStats] = useState({
    totalEarnings: 'N/A',
    activeAdsInChannels: 'N/A', // Ads currently running in their channels
    activeChannels: 'N/A',    // Their own active channels
    pendingRequests: 'N/A'    // Ad requests awaiting their approval
  });
  const [pendingAdsData, setPendingAdsData] = useState({ data: [], currentPage: 1, totalPages: 1, totalCount: 0 }); // Added totalCount
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estado para la navegación del sidebar
  const [activeItem, setActiveItem] = useState('dashboard');
  
  // Elementos del sidebar
  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
    { id: 'channels', label: 'Mis Canales', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg> },
    { id: 'ads', label: 'Anuncios', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg> },
    { id: 'finances', label: 'Finanzas', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { id: 'settings', label: 'Configuración', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  ];
  
  // Datos de ejemplo para actividades recientes
  const recentActivities = [
    { 
      content: 'Nuevo anuncio aprobado en Canal Tecnología', 
      timestamp: 'Hace 2 horas',
      icon: <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    },
    { 
      content: 'Pago recibido: $150.00', 
      timestamp: 'Hace 5 horas',
      icon: <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    },
    { 
      content: 'Nueva solicitud de anuncio en Canal Moda', 
      timestamp: 'Hace 1 día',
      icon: <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
    },
    { 
      content: 'Anuncio publicado en Canal Viajes', 
      timestamp: 'Hace 2 días',
      icon: <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
    },
  ];
  
  // Columnas para la tabla de anuncios pendientes (can remain as they define structure)
  const pendingAdsColumns = [
    {
      header: 'ID',
      accessor: 'id',
    },
    {
      header: 'Canal',
      accessor: 'channel',
    },
    {
      header: 'Anunciante',
      accessor: 'advertiser',
    },
    {
      header: 'Tipo',
      accessor: 'type',
    },
    {
      header: 'Fecha',
      accessor: 'requestDate',
    },
    {
      header: 'Precio',
      accessor: 'price',
      cellClassName: 'text-right font-medium text-green-600',
    },
    {
      header: 'Estado',
      accessor: 'status',
      render: (row) => (
        <Badge variant="warning">Pendiente</Badge>
      ),
    },
    {
      header: 'Acciones',
      render: (row) => (
        <Button size="sm" variant="outline">Ver detalle</Button>
      ),
    },
  ];
  
  // Función para manejar el cierre de sesión
  const handleLogout = () => {
    console.log('Logout');
  };
  
  // Función para manejar el clic en una fila de la tabla
  const handleRowClick = (row) => {
    console.log('Row clicked:', row);
  };
  
  return (
    <DashboardLayout
      sidebar={
        <Sidebar
          items={sidebarItems}
          activeItem={activeItem}
          onItemClick={setActiveItem}
          user={loggedInUser} // Use loggedInUser for sidebar
          onLogout={handleLogout}
        />
      }
      header={
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex space-x-4">
            <Button size="sm" variant="outline">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              Notificaciones
            </Button>
            <Button size="sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              Añadir Canal
            </Button>
          </div>
        </div>
      }
    >
      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Ingresos Totales"
          value="$1,250.00"
          icon={<svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          trend="up"
          trendValue="15% vs. mes anterior"
        />
        <StatCard
          title="Anuncios Activos"
          value="12"
          icon={<svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>}
          trend="up"
          trendValue="3 nuevos esta semana"
        />
        <StatCard
          title="Canales Activos"
          value="5"
          icon={<svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
          trend="same"
          trendValue="Sin cambios"
        />
        <StatCard
          title="Solicitudes Pendientes"
          value="3"
          icon={<svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>}
          trend="down"
          trendValue="2 menos que ayer"
        />
      </div>
      
      {/* Contenido principal en dos columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna izquierda (2/3) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Anuncios pendientes */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium text-gray-900">Anuncios Pendientes de Aprobación</h2>
              <Button size="sm" variant="outline">Ver todos</Button>
            </div>
            
            <Table
              columns={pendingAdsColumns}
              data={pendingAds}
              onRowClick={handleRowClick}
            />
            
            <div className="mt-4">
              <Pagination
                currentPage={1}
                totalPages={1}
                onPageChange={(page) => console.log('Page changed to:', page)}
              />
            </div>
          </div>
          
          {/* Rendimiento de canales */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Rendimiento de Canales</h2>
            
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Gráfico de rendimiento de canales</p>
            </div>
          </div>
        </div>
        
        {/* Columna derecha (1/3) */}
        <div className="space-y-8">
          {/* Actividad reciente */}
          <ActivityFeed
            activities={recentActivities}
            title="Actividad Reciente"
            viewAllLink="#"
          />
          
          {/* Próximos pagos */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Próximos Pagos</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-100">
                <div>
                  <p className="font-medium text-gray-900">Pago programado</p>
                  <p className="text-sm text-gray-600">28/03/2025</p>
                </div>
                <p className="font-bold text-green-600">$350.00</p>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">Saldo disponible</p>
                  <p className="text-sm text-gray-600">Para retiro</p>
                </div>
                <p className="font-bold text-gray-900">$150.00</p>
              </div>
              
              <Button className="w-full">Retirar Fondos</Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default withAuth(CreatorDashboard, ['creator', 'admin']); // Wrap with withAuth
