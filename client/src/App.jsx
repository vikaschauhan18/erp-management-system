
import React, { useEffect, useMemo, useState } from 'react';
import { Routes, Route, Navigate, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Users, Truck, ShoppingCart, ClipboardList, FileText, Settings, LogOut, Search, Plus, RefreshCw, Menu, X, Boxes, CircleDollarSign, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import api from './api';

const nav = [
  { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Products', path: '/products', icon: Package },
  { label: 'Customers', path: '/customers', icon: Users },
  { label: 'Suppliers', path: '/suppliers', icon: Truck },
  { label: 'Sales Orders', path: '/sales-orders', icon: ShoppingCart },
  { label: 'Purchase Orders', path: '/purchase-orders', icon: ClipboardList },
  { label: 'Goods Receipt', path: '/grn', icon: Boxes },
  { label: 'Invoices', path: '/invoices', icon: FileText }
];
const money = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n || 0));
const titleCase = s => s.replaceAll('-', ' ').replace(/\b\w/g, c => c.toUpperCase());

function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('erp_user') || 'null'));
  const [mobileNav, setMobileNav] = useState(false);
  const [toast, setToast] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => { setMobileNav(false); }, [location.pathname]);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(''), 3500); return () => clearTimeout(t); } }, [toast]);
  const login = data => {
    localStorage.setItem('erp_token', data.token);
    localStorage.setItem('erp_user', JSON.stringify(data.user));
    setUser(data.user);
    navigate('/dashboard');
  };
  const logout = () => { localStorage.removeItem('erp_token'); localStorage.removeItem('erp_user'); setUser(null); navigate('/login'); };
  if (!user) return <Routes><Route path="/login" element={<Login onLogin={login} />} /><Route path="*" element={<Navigate to="/login" replace />} /></Routes>;
  return <div className="app-shell">
    {mobileNav && <button className="scrim" aria-label="Close navigation" onClick={() => setMobileNav(false)} />}
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
      <div className="brand"><div className="brand-mark"><Boxes size={21}/></div><div><strong>northstar</strong><span>ENTERPRISE</span></div><button className="icon-btn close-nav" onClick={() => setMobileNav(false)}><X size={19}/></button></div>
      <div className="workspace-label">WORKSPACE</div>
      <nav>{nav.map(item => <NavLink key={item.path} to={item.path} className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}><item.icon size={18}/><span>{item.label}</span></NavLink>)}</nav>
      <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><Settings size={17}/></div><strong>Need a hand?</strong><p>Manage your operations with confidence.</p></div><div className="profile"><div className="avatar">{user.name?.slice(0,1).toUpperCase()}</div><div className="profile-info"><strong>{user.name}</strong><span>{user.role}</span></div><button className="icon-btn" title="Sign out" onClick={logout}><LogOut size={17}/></button></div></div>
    </aside>
    <main className="main-area"><header className="topbar"><button className="icon-btn menu-btn" onClick={() => setMobileNav(true)}><Menu size={21}/></button><div className="breadcrumb">Workspace <span>/</span> <strong>{titleCase(location.pathname.split('/')[1] || 'dashboard')}</strong></div><div className="topbar-right"><span className="status-dot"></span><span className="online-label">All systems operational</span><div className="top-avatar">{user.name?.slice(0,1).toUpperCase()}</div></div></header>
      <div className="page-wrap"><Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/products" element={<DataPage resource="products" title="Products" subtitle="Manage your catalogue, pricing and stock levels." columns={['title','sku','category','price','stock','reorderLevel']} fields={[['title','Product name'],['sku','SKU'],['category','Category'],['price','Unit price','number'],['stock','Opening stock','number'],['reorderLevel','Reorder level','number']]} moneyFields={['price']} />} />
        <Route path="/customers" element={<DataPage resource="customers" title="Customers" subtitle="Your customer directory, all in one place." columns={['name','email','phone','address']} fields={[['name','Customer name'],['email','Email'],['phone','Phone'],['address','Address']]} />} />
        <Route path="/suppliers" element={<DataPage resource="suppliers" title="Suppliers" subtitle="Keep supplier contact details organized." columns={['name','email','phone','address']} fields={[['name','Supplier name'],['email','Email'],['phone','Phone'],['address','Address']]} />} />
        <Route path="/sales-orders" element={<OrdersPage type="sales-orders" title="Sales Orders" />} />
        <Route path="/purchase-orders" element={<OrdersPage type="purchase-orders" title="Purchase Orders" />} />
        <Route path="/grn" element={<GRNPage />} />
        <Route path="/invoices" element={<InvoicesPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes></div>
    </main>
    {toast && <div className="toast"><CheckCircle2 size={18}/>{toast}</div>}
  </div>;
}

function Login({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: 'admin@erp.local', password: 'Admin123!' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const update = e => setForm({ ...form, [e.target.name]: e.target.value });
  async function submit(e) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const { data } = await api.post(`/auth/${mode === 'login' ? 'login' : 'register'}`, form);
      onLogin(data);
    } catch (err) { setError(err.response?.data?.message || 'Could not connect to the server. Is the API running?'); }
    finally { setLoading(false); }
  }
  return <div className="login-page"><div className="login-art"><div className="login-brand"><div className="brand-mark"><Boxes size={22}/></div><strong>northstar <span>ERP</span></strong></div><div className="art-copy"><div className="eyebrow">BUSINESS, IN SYNC</div><h1>Clarity for every<br/>part of your business.</h1><p>One connected workspace to manage inventory, orders, customers and the details that keep business moving.</p><div className="art-stats"><div><strong>01</strong><span>One workspace</span></div><div><strong>360°</strong><span>Business visibility</span></div><div><strong>24/7</strong><span>Operational clarity</span></div></div></div><div className="art-footer">OPERATIONS • INVENTORY • FINANCE</div></div><div className="login-panel"><form className="login-form" onSubmit={submit}><div className="mobile-login-brand"><div className="brand-mark"><Boxes size={20}/></div><strong>northstar ERP</strong></div><div className="eyebrow">{mode === 'login' ? 'WELCOME BACK' : 'GET STARTED'}</div><h2>{mode === 'login' ? 'Sign in to your workspace' : 'Create your account'}</h2><p className="muted">{mode === 'login' ? 'Enter your details to access your dashboard.' : 'The first registered user becomes the administrator.'}</p>{mode === 'register' && <label>Full name<input name="name" value={form.name} onChange={update} required placeholder="Your full name"/></label>}<label>Email address<input name="email" type="email" value={form.email} onChange={update} required placeholder="you@company.com"/></label><label>Password<input name="password" type="password" value={form.password} onChange={update} required minLength="8" placeholder="At least 8 characters"/></label>{error && <div className="error-box">{error}</div>}<button className="primary-btn full-btn" disabled={loading}>{loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'} <span>→</span></button>{mode === 'login' && <div className="demo-note">Demo credentials are pre-filled. Run the server seed script first.</div>}<div className="switch-mode">{mode === 'login' ? 'New to Northstar?' : 'Already have an account?'} <button type="button" onClick={() => {setMode(mode === 'login' ? 'register' : 'login');setError('');}}> {mode === 'login' ? 'Create account' : 'Sign in'}</button></div><div className="login-legal">Secure access • Role-based permissions</div></form></div></div>;
}

function PageHeading({ eyebrow='OPERATIONS', title, subtitle, action }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{subtitle}</p></div>{action}</div>;
}
function Dashboard() {
  const [data, setData] = useState(null), [error, setError] = useState('');
  useEffect(() => { api.get('/dashboard').then(r => setData(r.data)).catch(e => setError(e.response?.data?.message || 'Could not load dashboard')); }, []);
  const stats = data ? [
    {label:'Total products',value:data.products,icon:Package,sub:'Across your catalogue',tone:'blue'},
    {label:'Customers',value:data.customers,icon:Users,sub:'Customer records',tone:'violet'},
    {label:'Purchase orders',value:data.purchaseOrders,icon:ClipboardList,sub:'Supplier replenishment',tone:'amber'},
    {label:'Paid revenue',value:money(data.paidRevenue),icon:CircleDollarSign,sub:`${data.invoices} invoices created`,tone:'green'}
  ] : [];
  return <><PageHeading title="Good business starts here." subtitle="Here’s your operational snapshot for today." action={<button className="secondary-btn" onClick={() => window.location.reload()}><RefreshCw size={16}/> Refresh</button>}/>{error && <div className="error-box">{error}</div>}<div className="welcome-strip"><div><div className="welcome-tag">YOUR BUSINESS AT A GLANCE</div><h2>Everything in its right place.</h2><p>Track inventory, coordinate orders and keep teams moving together.</p></div><div className="welcome-graphic"><div className="orb orb-one"></div><div className="orb orb-two"></div><Boxes size={74} strokeWidth={1.1}/></div></div><div className="section-header"><div><h2>Performance overview</h2><p>Key metrics from your ERP workspace</p></div><span className="live-pill"><span/> LIVE DATA</span></div><div className="stats-grid">{stats.map(s=><div className="stat-card" key={s.label}><div className={`stat-icon ${s.tone}`}><s.icon size={19}/></div><div className="stat-label">{s.label}</div><div className="stat-value">{s.value}</div><div className="stat-sub">{s.sub}</div></div>)}</div><div className="dashboard-grid"><div className="panel"><div className="panel-head"><div><h3>Workspace modules</h3><p>Your core business areas</p></div><span className="subtle-chip">8 modules</span></div><div className="module-grid">{nav.slice(1).map((n,i)=><NavLink key={n.path} to={n.path} className="module-tile"><div className="module-icon"><n.icon size={19}/></div><div><strong>{n.label}</strong><span>{['Catalogue & stock','Customer directory','Supplier directory','Customer fulfilment','Stock replenishment','Inbound stock','Billing & payments'][i]}</span></div><span className="module-arrow">↗</span></NavLink>)}</div></div><div className="panel health-panel"><div className="panel-head"><div><h3>Inventory health</h3><p>Stock needing attention</p></div><AlertTriangle size={19} className="warning-text"/></div><div className="health-number">{data?.lowStock ?? '—'}<span> items</span></div><p className="muted small">Products at or below their reorder level.</p><NavLink to="/products" className="text-link">Review inventory <span>→</span></NavLink><div className="health-divider"></div><div className="health-row"><div className="health-check"><CheckCircle2 size={17}/></div><div><strong>Operations dashboard</strong><span>Connected to ERP API</span></div><span className="mini-status">Ready</span></div></div></div></>;
}

function DataPage({resource,title,subtitle,columns,fields,moneyFields=[]}) {
  const [items,setItems]=useState([]),[search,setSearch]=useState(''),[loading,setLoading]=useState(true),[error,setError]=useState(''),[modal,setModal]=useState(false),[editing,setEditing]=useState(null),[form,setForm]=useState({});
  async function load(){setLoading(true);setError('');try{const r=await api.get(`/${resource}`,{params:{search,limit:100}});setItems(r.data.items||[]);}catch(e){setError(e.response?.data?.message||'Unable to load records');}finally{setLoading(false);}}
  useEffect(()=>{const t=setTimeout(load,250);return()=>clearTimeout(t);},[resource,search]);
  function open(item=null){setEditing(item);const f={};fields.forEach(([k])=>f[k]=item?.[k] ?? (['price','stock','reorderLevel'].includes(k)?0:''));setForm(f);setModal(true);}
  async function save(e){e.preventDefault();setError('');try{if(editing)await api.put(`/${resource}/${editing._id}`,form);else await api.post(`/${resource}`,form);setModal(false);await load();}catch(e){setError(e.response?.data?.message||'Could not save record');}}
  async function remove(item){if(!confirm(`Delete ${item.title||item.name||'this record'}?`))return;try{await api.delete(`/${resource}/${item._id}`);await load();}catch(e){setError(e.response?.data?.message||'Could not delete record');}}
  return <><PageHeading title={title} subtitle={subtitle} action={<button className="primary-btn" onClick={()=>open()}><Plus size={17}/> Add {title.replace(/s$/,'')}</button>}/><div className="table-toolbar"><div className="search-box"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={`Search ${title.toLowerCase()}…`}/></div><span className="record-count">{items.length} records</span></div>{error && <div className="error-box">{error}</div>}<div className="table-panel"><div className="table-scroll"><table><thead><tr>{columns.map(c=><th key={c}>{titleCase(c)}</th>)}<th>Actions</th></tr></thead><tbody>{loading?<tr><td colSpan={columns.length+1} className="empty-cell">Loading records…</td></tr>:items.length===0?<tr><td colSpan={columns.length+1} className="empty-cell">No records yet. Add your first record to get started.</td></tr>:items.map(item=><tr key={item._id}>{columns.map(c=><td key={c}>{moneyFields.includes(c)?money(item[c]):c==='stock' && Number(item.stock)<=Number(item.reorderLevel)?<span className="stock-low">{item[c]} · Low</span>:item[c] ?? '—'}</td>)}<td><div className="row-actions"><button onClick={()=>open(item)}>Edit</button><button className="danger-link" onClick={()=>remove(item)}>Delete</button></div></td></tr>)}</tbody></table></div></div>{modal&&<div className="modal-backdrop" onClick={()=>setModal(false)}><form className="modal" onSubmit={save} onClick={e=>e.stopPropagation()}><div className="modal-head"><div><div className="eyebrow">{editing?'UPDATE RECORD':'NEW RECORD'}</div><h2>{editing?'Edit':'Add'} {title.replace(/s$/,'')}</h2></div><button type="button" className="icon-btn" onClick={()=>setModal(false)}><X size={19}/></button></div><div className="form-grid">{fields.map(([key,label,type])=><label key={key}>{label}<input type={type==='number'?'number':key==='email'?'email':'text'} min={type==='number'?'0':undefined} step={type==='number'?'any':undefined} required={['title','name','sku','price'].includes(key)} value={form[key]??''} onChange={e=>setForm({...form,[key]:type==='number'?Number(e.target.value):e.target.value})}/></label>)}</div>{error&&<div className="error-box">{error}</div>}<div className="modal-actions"><button type="button" className="secondary-btn" onClick={()=>setModal(false)}>Cancel</button><button className="primary-btn">{editing?'Save changes':'Create record'}</button></div></form></div>}</>;
}

function OrdersPage({type,title}) {
  const sales=type==='sales-orders', partyKey=sales?'customer':'supplier';
  const [items,setItems]=useState([]),[parties,setParties]=useState([]),[products,setProducts]=useState([]),[error,setError]=useState(''),[modal,setModal]=useState(false),[form,setForm]=useState({party:'',product:'',quantity:1,notes:''}),[busy,setBusy]=useState(false);
  async function load(){try{const [o,p,c]=await Promise.all([api.get(`/${type}`),api.get('/products'),api.get(`/${sales?'customers':'suppliers'}`)]);setItems(o.data.items||[]);setProducts(p.data.items||[]);setParties(c.data.items||[]);if(!form.party&&c.data.items?.[0])setForm(f=>({...f,party:c.data.items[0]._id}));if(!form.product&&p.data.items?.[0])setForm(f=>({...f,product:p.data.items[0]._id}));}catch(e){setError(e.response?.data?.message||'Could not load orders');}}
  useEffect(()=>{load();},[type]);
  async function create(e){e.preventDefault();setBusy(true);setError('');try{await api.post(`/${type}`,{[partyKey]:form.party,items:[{product:form.product,quantity:Number(form.quantity)}],notes:form.notes});setModal(false);await load();}catch(e){setError(e.response?.data?.message||'Could not create order');}finally{setBusy(false);}}
  async function updateStatus(item,status){try{await api.put(`/${type}/${item._id}`,{status});await load();}catch(e){setError(e.response?.data?.message||'Could not update order');}}
  return <><PageHeading title={title} subtitle={sales?'Manage customer orders and fulfilment.':'Manage supplier orders and stock replenishment.'} action={<button className="primary-btn" onClick={()=>setModal(true)}><Plus size={17}/> New order</button>}/>{error&&<div className="error-box">{error}</div>}<div className="table-panel"><div className="table-scroll"><table><thead><tr><th>Order</th><th>{sales?'Customer':'Supplier'}</th><th>Items</th><th>Total</th><th>Status</th><th>Created</th><th>Update status</th></tr></thead><tbody>{items.length===0?<tr><td colSpan="7" className="empty-cell">No orders found. Create your first order.</td></tr>:items.map(o=><tr key={o._id}><td><strong>{o.orderNumber}</strong></td><td>{o[partyKey]?.name||'—'}</td><td>{o.items?.map(i=>`${i.title||i.product?.title||'Product'} × ${i.quantity}`).join(', ')}</td><td>{money(o.totalPrice)}</td><td><span className={`status-pill ${o.status?.toLowerCase()}`}>{o.status}</span></td><td>{new Date(o.createdAt).toLocaleDateString('en-IN')}</td><td><select className="inline-select" value={o.status} onChange={e=>updateStatus(o,e.target.value)}>{(sales?['Draft','Confirmed','Fulfilled','Cancelled']:['Draft','Ordered','Received','Cancelled']).map(s=><option key={s}>{s}</option>)}</select></td></tr>)}</tbody></table></div></div>{modal&&<div className="modal-backdrop" onClick={()=>setModal(false)}><form className="modal" onSubmit={create} onClick={e=>e.stopPropagation()}><div className="modal-head"><div><div className="eyebrow">ORDER MANAGEMENT</div><h2>Create {sales?'sales':'purchase'} order</h2></div><button type="button" className="icon-btn" onClick={()=>setModal(false)}><X size={19}/></button></div>{!parties.length||!products.length?<div className="error-box">Add at least one {sales?'customer':'supplier'} and one product before creating an order.</div>:<><label>{sales?'Customer':'Supplier'}<select required value={form.party} onChange={e=>setForm({...form,party:e.target.value})}>{parties.map(p=><option key={p._id} value={p._id}>{p.name}</option>)}</select></label><label>Product<select required value={form.product} onChange={e=>setForm({...form,product:e.target.value})}>{products.map(p=><option key={p._id} value={p._id}>{p.title} · {money(p.price)}</option>)}</select></label><label>Quantity<input type="number" min="1" required value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})}/></label><label>Notes (optional)<input value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></label></>}{error&&<div className="error-box">{error}</div>}<div className="modal-actions"><button type="button" className="secondary-btn" onClick={()=>setModal(false)}>Cancel</button><button disabled={busy||!parties.length||!products.length} className="primary-btn">{busy?'Creating…':'Create order'}</button></div></form></div>}</>;
}

function GRNPage(){
 const [items,setItems]=useState([]),[orders,setOrders]=useState([]),[error,setError]=useState(''),[modal,setModal]=useState(false),[purchaseOrder,setPurchaseOrder]=useState('');
 async function load(){try{const [g,p]=await Promise.all([api.get('/grn'),api.get('/purchase-orders')]);setItems(g.data.items||[]);setOrders((p.data.items||[]).filter(x=>x.status!=='Received'&&x.status!=='Cancelled'));if(!purchaseOrder&&p.data.items?.[0])setPurchaseOrder(p.data.items[0]._id);}catch(e){setError(e.response?.data?.message||'Could not load GRNs');}}
 useEffect(()=>{load();},[]);
 async function create(e){e.preventDefault();setError('');try{await api.post('/grn',{purchaseOrder});setModal(false);await load();}catch(e){setError(e.response?.data?.message||'Could not create GRN');}}
 return <><PageHeading title="Goods receipt notes" subtitle="Record incoming goods and update stock from purchase orders." action={<button className="primary-btn" onClick={()=>setModal(true)}><Plus size={17}/> Receive goods</button>}/>{error&&<div className="error-box">{error}</div>}<div className="table-panel"><div className="table-scroll"><table><thead><tr><th>GRN number</th><th>Purchase order</th><th>Items received</th><th>Received date</th></tr></thead><tbody>{items.length===0?<tr><td colSpan="4" className="empty-cell">No goods receipts yet.</td></tr>:items.map(g=><tr key={g._id}><td><strong>{g.grnNumber}</strong></td><td>{g.purchaseOrder?.orderNumber||'—'}</td><td>{g.receivedItems?.map(i=>`${i.product?.title||'Product'} × ${i.quantity}`).join(', ')}</td><td>{new Date(g.receivedAt||g.createdAt).toLocaleDateString('en-IN')}</td></tr>)}</tbody></table></div></div>{modal&&<div className="modal-backdrop" onClick={()=>setModal(false)}><form className="modal" onSubmit={create} onClick={e=>e.stopPropagation()}><div className="modal-head"><div><div className="eyebrow">INVENTORY</div><h2>Receive purchase order</h2></div><button type="button" className="icon-btn" onClick={()=>setModal(false)}><X size={19}/></button></div>{orders.length?<label>Purchase order<select value={purchaseOrder} onChange={e=>setPurchaseOrder(e.target.value)}>{orders.map(o=><option key={o._id} value={o._id}>{o.orderNumber} · {o.supplier?.name||'Supplier'}</option>)}</select></label>:<p className="muted">No open purchase orders. Create a purchase order first.</p>}{error&&<div className="error-box">{error}</div>}<div className="modal-actions"><button type="button" className="secondary-btn" onClick={()=>setModal(false)}>Cancel</button><button disabled={!orders.length} className="primary-btn">Confirm receipt</button></div></form></div>}</>;
}
function InvoicesPage(){
 const [items,setItems]=useState([]),[orders,setOrders]=useState([]),[error,setError]=useState('');
 async function load(){try{const [i,o]=await Promise.all([api.get('/invoices'),api.get('/sales-orders')]);setItems(i.data.items||[]);setOrders((o.data.items||[]).filter(x=>x.status!=='Cancelled'));}catch(e){setError(e.response?.data?.message||'Could not load invoices');}}
 useEffect(()=>{load();},[]);
 async function create(){setError('');if(!orders.length)return setError('Create a sales order first.');try{await api.post('/invoices',{salesOrder:orders[0]._id});await load();}catch(e){setError(e.response?.data?.message||'Could not create invoice');}}
 async function status(item,value){try{await api.patch(`/invoices/${item._id}/status`,{status:value});await load();}catch(e){setError(e.response?.data?.message||'Could not update invoice');}}
 return <><PageHeading title="Invoices" subtitle="Generate invoices from sales orders and track payment status." action={<button className="primary-btn" onClick={create}><Plus size={17}/> Generate invoice</button>}/>{error&&<div className="error-box">{error}</div>}<div className="table-panel"><div className="table-scroll"><table><thead><tr><th>Invoice</th><th>Sales order</th><th>Customer</th><th>Amount</th><th>Status</th><th>Issued</th><th>Payment status</th></tr></thead><tbody>{items.length===0?<tr><td colSpan="7" className="empty-cell">No invoices yet. Generate one from a sales order.</td></tr>:items.map(i=><tr key={i._id}><td><strong>{i.invoiceNumber}</strong></td><td>{i.salesOrder?.orderNumber||'—'}</td><td>{i.customer?.name||'—'}</td><td>{money(i.amount)}</td><td><span className={`status-pill ${i.status.toLowerCase()}`}>{i.status}</span></td><td>{new Date(i.createdAt).toLocaleDateString('en-IN')}</td><td><select className="inline-select" value={i.status} onChange={e=>status(i,e.target.value)}>{['Unpaid','Paid','Overdue'].map(s=><option key={s}>{s}</option>)}</select></td></tr>)}</tbody></table></div></div></>;
}
export default App;
