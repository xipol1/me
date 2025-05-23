import React, { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import Table from '../components/Table';
import Pagination from '../components/Pagination';
import Badge from '../components/Badge';
import Button from '../components/Button';
import FilterBar from '../components/FilterBar';
import Tabs from '../components/Tabs';

const AdminDashboard = () => {
  // Estado para la navegación del sidebar
  const [activeItem, setActiveItem] = useState('dashboard');
  
  // Datos de ejemplo para el usuario
  const user = {
    name: 'Admin',
    email: 'admin@plataforma.com',
    avatar: null
  };
  
  // Elementos del sidebar
  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
    { id: 'users', label: 'Usuarios', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
    { id: 'channels', label: 'Canales', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg> },
    { id: 'ads', label: 'Anuncios', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg> },
    { id: 'payments', label: 'Pagos', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { id: 'settings', label: 'Configuración', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  ];
  
  // Datos de ejemplo para usuarios
  const users = [
    {
      id: '001',
      name: 'Ana Martínez',
      type: 'Creador',
      email: 'ana.martinez@ejemplo.com',
      registrationDate: '15/01/2025',
      status: 'Activo'
    },
    {
      id: '002',
      name: 'Carlos López',
      type: 'Anunciante',
      email: 'carlos.lopez@ejemplo.com',
      registrationDate: '20/02/2025',
      status: 'Activo'
    },
    {
      id: '003',
      name: 'Laura Rodríguez',
      type: 'Creador',
      email: 'laura.rodriguez@ejemplo.com',
      registrationDate: '05/03/2025',
      status: 'Suspendido'
    }
  ];
  
  // Columnas para la tabla de usuarios
  const usersColumns = [
    {
      header: 'ID',
      accessor: 'id',
    },
    {
      header: 'Nombre',
      accessor: 'name',
    },
    {
      header: 'Tipo',
      accessor: 'type',
    },
    {
      header: 'Email',
      accessor: 'email',
    },
    {
      header: 'Registro',
      accessor: 'registrationDate',
    },
    {
      header: 'Estado',
      accessor: 'status',
      render: (row) => (
        <Badge variant={row.status === 'Activo' ? 'success' : 'error'}>
          {row.status}
        </Badge>
      ),
    },
    {
      header: 'Acciones',
      render: (row) => (
        <div className="flex space-x-2">
          <Button size="sm" variant="outline">Ver</Button>
          <Button size="sm" variant="outline">Editar</Button>
          {row.status === 'Activo' ? (
            <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">Suspender</Button>
          ) : (
            <Button size="sm" variant="outline" className="text-green-600 border-green-300 hover:bg-green-50">Activar</Button>
          )}
        </div>
      ),
    },
  ];
  
  // Datos de ejemplo para canales
  const channels = [
    {
      id: '001',
      name: 'Canal Tecnología',
      platform: 'Telegram',
      creator: 'Ana Martínez',
      audience: '50K',
      status: 'Verificado'
    },
    {
      id: '002',
      name: 'Moda y Tendencias',
      platform: 'Instagram',
      creator: 'Laura Rodríguez',
      audience: '100K',
      status: 'Pendiente'
    },
    {
      id: '003',
      name: 'Viajes por el Mundo',
      platform: 'WhatsApp',
      creator: 'Pedro Sánchez',
      audience: '25K',
      status: 'Suspendido'
    }
  ];
  
  // Columnas para la tabla de canales
  const channelsColumns = [
    {
      header: 'ID',
      accessor: 'id',
    },
    {
      header: 'Nombre',
      accessor: 'name',
    },
    {
      header: 'Plataforma',
      accessor: 'platform',
    },
    {
      header: 'Creador',
      accessor: 'creator',
    },
    {
      header: 'Audiencia',
      accessor: 'audience',
    },
    {
      header: 'Estado',
      accessor: 'status',
      render: (row) => {
        let variant = 'info';
        if (row.status === 'Verificado') variant = 'success';
        if (row.status === 'Pendiente') variant = 'warning';
        if (row.status === 'Suspendido') variant = 'error';
        
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      header: 'Acciones',
      render: (row) => (
        <div className="flex space-x-2">
          <Button size="sm" variant="outline">Ver</Button>
          <Button size="sm" variant="outline">Editar</Button>
          {row.status === 'Pendiente' && (
            <Button size="sm" variant="outline" className="text-green-600 border-green-300 hover:bg-green-50">Verificar</Button>
          )}
          {row.status !== 'Suspendido' && (
            <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">Suspender</Button>
          )}
        </div>
      ),
    },
  ];
  
  // Datos de ejemplo para alertas del sistema
  const systemAlerts = [
    {
      id: '001',
      message: '5 canales pendientes de verificación',
      type: 'warning',
      action: 'Ver canales'
    },
    {
      id: '002',
      message: '3 solicitudes de retiro pendientes',
      type: 'info',
      action: 'Ver pagos'
    },
    {
      id: '003',
      message: '2 reportes de usuarios sin resolver',
      type: 'error',
      action: 'Ver reportes'
    }
  ];
  
  // Función para manejar el cierre de sesión
  const handleLogout = () => {
    console.log('Logout');
  };
  
  // Función para manejar el clic en una fila de la tabla
  const handleRowClick = (row) => {
    console.log('Row clicked:', row);
  };
  
  // Filtros para usuarios
  const userFilters = [
    {
      id: 'userType',
      label: 'Tipo de usuario',
      type: 'select',
      value: 'all',
      options: [
        { value: 'all', label: 'Todos' },
        { value: 'creator', label: 'Creador' },
        { value: 'advertiser', label: 'Anunciante' }
      ]
    },
    {
      id: 'userStatus',
      label: 'Estado',
      type: 'select',
      value: 'all',
      options: [
        { value: 'all', label: 'Todos' },
        { value: 'active', label: 'Activo' },
        { value: 'suspended', label: 'Suspendido' }
      ]
    },
    {
      id: 'userSearch',
      label: 'Buscar',
      type: 'text',
      value: '',
      placeholder: 'Nombre, email o ID'
    }
  ];
  
  // Filtros para canales
  const channelFilters = [
    {
      id: 'platform',
      label: 'Plataforma',
      type: 'select',
      value: 'all',
      options: [
        { value: 'all', label: 'Todas' },
        { value: 'telegram', label: 'Telegram' },
        { value: 'whatsapp', label: 'WhatsApp' },
        { value: 'instagram', label: 'Instagram' },
        { value: 'facebook', label: 'Facebook' },
        { value: 'discord', label: 'Discord' }
      ]
    },
    {
      id: 'channelStatus',
      label: 'Estado',
      type: 'select',
      value: 'all',
      options: [
        { value: 'all', label: 'Todos' },
        { value: 'verified', label: 'Verificado' },
        { value: 'pending', label: 'Pendiente' },
        { value: 'suspended', label: 'Suspendido' }
      ]
    },
    {
      id: 'channelSearch',
      label: 'Buscar',
      type: 'text',
      value: '',
      placeholder: 'Nombre o ID'
    }
  ];
  
  // Estado para las pestañas
  const [activeTab, setActiveTab] = useState('users');
  
  // Configuración de pestañas
  const tabs = [
    { id: 'users', label: 'Usuarios' },
    { id: 'channels', label: 'Canales' }
  ];
  
  // Manejar cambios en los filtros
  const handleFilterChange = (filterId, value) => {
    console.log('Filter changed:', filterId, value);
  };
  
  return (
    <DashboardLayout
      sidebar={
        <Sidebar
          items={sidebarItems}
          activeItem={activeItem}
          onItemClick={setActiveItem}
          user={user}
          onLogout={handleLogout}
        />
      }
      header={
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
          <div className="flex space-x-4">
            <Button size="sm" variant="outline">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              Alertas
            </Button>
          </div>
        </div>
      }
    >
      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Usuarios Totales"
          value="1,250"
          icon={<svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
          trend="up"
          trendValue="15% vs. mes anterior"
        />
        <StatCard
          title="Canales Activos"
          value="450"
          icon={<svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
          trend="up"
          trendValue="8% vs. mes anterior"
        />
        <StatCard
          title="Anuncios Activos"
          value="850"
          icon={<svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>}
          trend="up"
          trendValue="12% vs. mes anterior"
        />
        <StatCard
          title="Ingresos Totales"
          value="$45,250.00"
          icon={<svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          trend="up"
          trendValue="20% vs. mes anterior"
        />
      </div>
      
      {/* Alertas del sistema */}
      <div className="mb-8">
        <div className="bg-white rounded-xl shadow-card p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Alertas del Sistema</h2>
          
          <div className="space-y-3">
            {systemAlerts.map((alert) => (
              <div 
                key={alert.id} 
                className={`p-4 rounded-lg flex justify-between items-center ${
                  alert.type === 'warning' ? 'bg-yellow-50 border border-yellow-100' :
                  alert.type === 'error' ? 'bg-red-50 border border-red-100' :
                  'bg-blue-50 border border-blue-100'
                }`}
              >
                <div className="flex items-center">
                  {alert.type === 'warning' && (
                    <svg className="w-5 h-5 text-yellow-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                  {alert.type === 'error' && (
                    <svg className="w-5 h-5 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {alert.type === 'info' && (
                    <svg className="w-5 h-5 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  <span className={`font-medium ${
                    alert.type === 'warning' ? 'text-yellow-800' :
                    alert.type === 'error' ? 'text-red-800' :
                    'text-blue-800'
                  }`}>
                    {alert.message}
                  </span>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className={
                    alert.type === 'warning' ? 'border-yellow-300 text-yellow-800 hover:bg-yellow-100' :
                    alert.type === 'error' ? 'border-red-300 text-red-800 hover:bg-red-100' :
                    'border-blue-300 text-blue-800 hover:bg-blue-100'
                  }
                >
                  {alert.action}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Gestión de usuarios y canales */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <Tabs 
          tabs={tabs} 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          className="mb-6"
        />
        
        {activeTab === 'users' && (
          <>
            <FilterBar 
              filters={userFilters} 
              onFilterChange={handleFilterChange} 
              className="mb-6"
            />
            
            <Table
              columns={usersColumns}
              data={users}
              onRowClick={handleRowClick}
            />
            
            <div className="mt-4">
              <Pagination
                currentPage={1}
                totalPages={5}
                onPageChange={(page) => console.log('Page changed to:', page)}
              />
            </div>
          </>
        )}
        
        {activeTab === 'channels' && (
          <>
            <FilterBar 
              filters={channelFilters} 
              onFilterChange={handleFilterChange} 
              className="mb-6"
            />
            
            <Table
              columns={channelsColumns}
              data={channels}
              onRowClick={handleRowClick}
            />
            
            <div className="mt-4">
              <Pagination
                currentPage={1}
                totalPages={5}
                onPageChange={(page) => console.log('Page changed to:', page)}
              />
            </div>
          </>
        )}
      </div>
      
      {/* Métricas de plataforma */}
      <div className="mt-8 bg-white rounded-xl shadow-card p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-6">Métricas de Plataforma</h2>
        
        <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">Gráficos de crecimiento, ingresos, etc.</p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
