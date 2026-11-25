import React, { useEffect, useMemo, useState } from "react";
import { Link, Route, Routes, useNavigate } from "react-router-dom";
import { ShoppingBag, Search, Menu, X, ShieldCheck, Truck, Headphones, Instagram, Plus, Minus, Trash2, Package, LogOut, LayoutDashboard, ImagePlus } from "lucide-react";
import { supabase, isConfigured } from "./lib/supabase";

const demoProducts = [
  { id: "demo-earbuds", name: "Wireless Earbuds with ANC – White", category: "Audio", price: 1499, compare_at: 1599, description: "Stylish wireless earbuds with a compact charging case. Check the supplier's confirmed specifications before ordering.", image_url: "", active: true },
  { id: "demo-stand", name: "Adjustable Mobile Phone Stand", category: "Accessories", price: 699, compare_at: 899, description: "A practical stand for desks, video calls and everyday viewing.", image_url: "", active: true },
  { id: "demo-led", name: "LED Strip Lights", category: "Lighting", price: 999, compare_at: 1199, description: "Decorative LED lighting. Confirm length, colour modes and power details with the supplier.", image_url: "", active: true }
];

function money(n) { return `Rs. ${Number(n || 0).toLocaleString("en-PK")}`; }

function useProducts() {
  const [products, setProducts] = useState(demoProducts);
  useEffect(() => {
    if (!supabase) return;
    supabase.from("products").select("*").eq("active", true).order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setProducts(data); });
  }, []);
  return products;
}

function Header({ count }) {
  const [open, setOpen] = useState(false);
  return <header className="header"><Link to="/" className="brand"><span className="brand-mark">TZ</span><span>TECH<span className="purple">ZEN</span><small>TECH MADE EASY</small></span></Link>
    <nav className={open ? "nav nav-open" : "nav"}><Link onClick={() => setOpen(false)} to="/">Home</Link><a href="/#shop" onClick={() => setOpen(false)}>Shop</a><a href="/#about" onClick={() => setOpen(false)}>About</a><Link onClick={() => setOpen(false)} to="/admin">Admin</Link></nav>
    <div className="header-actions"><a className="cart-link" href="/#shop"><ShoppingBag size={18}/><span>{count}</span></a><button className="icon-btn mobile-menu" onClick={() => setOpen(!open)} aria-label="Toggle menu">{open ? <X/> : <Menu/>}</button></div>
  </header>;
}

function ProductCard({ product, add }) {
  return <article className="product-card"><div className="product-image">{product.image_url ? <img src={product.image_url} alt={product.name}/> : <div className="image-placeholder"><Package size={42}/><span>TECHZEN</span></div>}
    {product.compare_at > product.price && <span className="sale-tag">SALE</span>}</div>
    <div className="product-info"><span className="eyebrow">{product.category || "Gadgets"}</span><h3>{product.name}</h3><p className="price">{money(product.price)} {product.compare_at > product.price && <del>{money(product.compare_at)}</del>}</p><button className="button button-small" onClick={() => add(product)}>Add to cart</button></div></article>;
}

function Home({ products, add }) {
  const [query, setQuery] = useState("");
  const filtered = products.filter(p => `${p.name} ${p.category}`.toLowerCase().includes(query.toLowerCase()));
  return <><section className="hero"><div className="hero-copy"><span className="eyebrow purple">WELCOME TO TECHZEN</span><h1>Technology that<br/><span className="gradient-text">fits your life.</span></h1><p>Discover useful gadgets and everyday tech essentials at affordable prices.</p><a href="#shop" className="button">Explore products <ShoppingBag size={17}/></a><div className="hero-note"><ShieldCheck size={16}/> Clear pricing · Order support · Pakistan</div></div><div className="hero-art"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="hero-logo">TZ<span>+</span></div><div className="floating-chip">TECH MADE EASY</div></div></section>
    <section className="trust-strip"><div><Truck/><span>Delivery details confirmed at checkout</span></div><div><ShieldCheck/><span>Transparent product information</span></div><div><Headphones/><span>Customer support</span></div></section>
    <section id="shop" className="section"><div className="section-heading"><div><span className="eyebrow purple">OUR COLLECTION</span><h2>Explore products</h2></div><label className="search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search products..."/></label></div>
    {filtered.length ? <div className="product-grid">{filtered.map(p=><ProductCard key={p.id} product={p} add={add}/>)}</div> : <p className="muted">No products found.</p>}</section>
    <section id="about" className="about section"><span className="eyebrow purple">WHY TECHZEN</span><h2>Shop smart. Live better.</h2><p>We're building a simple, transparent way to discover everyday technology. Product availability, delivery and return terms are confirmed before an order is accepted.</p></section></>;
}

function Checkout({ cart, clear, updateQty }) {
  const [form, setForm] = useState({ name:"", phone:"", address:"", city:"Karachi", notes:"" });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const total = cart.reduce((s,x)=>s+x.price*x.qty,0);
  const change = e => setForm({...form,[e.target.name]:e.target.value});
  async function submit(e) {
    e.preventDefault(); setBusy(true); setMessage("");
    const items = cart.map(x=>({ product_id: x.id, name:x.name, unit_price:x.price, quantity:x.qty }));
    const payload = { customer_name:form.name, phone:form.phone, address:form.address, city:form.city, notes:form.notes, items, total, status:"pending", payment_method:"cash_on_delivery" };
    if (!supabase) { setMessage("Connect Supabase first to accept real orders. Your cart is still saved on this page."); setBusy(false); return; }
    const { error } = await supabase.from("orders").insert(payload);
    setBusy(false);
    if (error) setMessage("We couldn't submit the order. Please try again or contact support.");
    else { setMessage("Order request received! The store will contact you to confirm availability and delivery."); clear(); }
  }
  return <main className="section checkout"><div><span className="eyebrow purple">SECURE ORDER REQUEST</span><h1>Checkout</h1><p className="muted">Submit your details. We'll confirm stock, delivery charges and the final amount before dispatch.</p>
    {cart.length===0 ? <p>Your cart is empty. <Link to="/">Continue shopping</Link></p> : <form className="checkout-form" onSubmit={submit}>
      <label>Full name<input required name="name" value={form.name} onChange={change} placeholder="Your name"/></label><label>Phone number<input required name="phone" value={form.phone} onChange={change} placeholder="03XXXXXXXXX" pattern="^[0-9+ -]{10,16}$"/></label><label>City<input required name="city" value={form.city} onChange={change}/></label><label>Full delivery address<textarea required name="address" value={form.address} onChange={change} rows="3" placeholder="House, street, area"/></label><label>Order notes (optional)<textarea name="notes" value={form.notes} onChange={change} rows="2"/></label>
      <div className="order-summary"><h3>Order summary</h3>{cart.map(x=><div className="summary-row" key={x.id}><span>{x.name} × {x.qty}</span><b>{money(x.price*x.qty)}</b></div>)}<div className="summary-total"><span>Subtotal</span><b>{money(total)}</b></div><small>Delivery charges are confirmed separately before dispatch.</small></div>
      <button disabled={busy} className="button">{busy?"Submitting...":"Place order request"}</button>{message&&<p className="notice" role="status">{message}</p>}
    </form>}</div></main>;
}

function Admin() {
  const [session, setSession] = useState(null);
  const [email,setEmail]=useState(""); const [password,setPassword]=useState("");
  const [products,setProducts]=useState([]); const [orders,setOrders]=useState([]); const [notice,setNotice]=useState("");
  const [draft,setDraft]=useState({name:"",category:"Accessories",price:"",compare_at:"",description:"",image_url:"",active:true});
  useEffect(()=>{ if(!supabase)return; supabase.auth.getSession().then(({data})=>setSession(data.session)); const {data:{subscription}}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s)); return ()=>subscription.unsubscribe(); },[]);
  async function load(){ if(!supabase)return; const [p,o]=await Promise.all([supabase.from("products").select("*").order("created_at",{ascending:false}),supabase.from("orders").select("*").order("created_at",{ascending:false})]); if(p.data)setProducts(p.data); if(o.data)setOrders(o.data); }
  useEffect(()=>{if(session)load();},[session]);
  async function login(e){e.preventDefault();if(!supabase){setNotice("Add your Supabase URL and publishable key to the Cloudflare Pages environment variables first.");return;}const {error}=await supabase.auth.signInWithPassword({email,password});setNotice(error?error.message:"");}
  async function save(e){e.preventDefault();const row={...draft,price:Number(draft.price),compare_at:Number(draft.compare_at||0)};const {error}=await supabase.from("products").insert(row);setNotice(error?error.message:"Product added.");if(!error){setDraft({name:"",category:"Accessories",price:"",compare_at:"",description:"",image_url:"",active:true});load();}}
  async function updateStatus(id,status){const {error}=await supabase.from("orders").update({status}).eq("id",id);setNotice(error?error.message:"Order updated.");load();}
  async function remove(id){if(!confirm("Delete this product?"))return;const {error}=await supabase.from("products").delete().eq("id",id);setNotice(error?error.message:"Product deleted.");load();}
  if(!session)return <main className="section admin-wrap"><div className="admin-login"><span className="eyebrow purple">TECHZEN MANAGEMENT</span><h1>Admin login</h1><p className="muted">Sign in with the admin account created in Supabase.</p><form onSubmit={login}><label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Password<input type="password" required value={password} onChange={e=>setPassword(e.target.value)}/></label><button className="button">Sign in</button></form>{notice&&<p className="notice">{notice}</p>}</div></main>;
  return <main className="section admin-wrap"><div className="admin-title"><div><span className="eyebrow purple">STORE CONTROL</span><h1>Dashboard</h1></div><button className="button button-outline" onClick={()=>supabase.auth.signOut()}><LogOut size={16}/> Sign out</button></div>
    <div className="stats"><div><LayoutDashboard/><small>Products</small><b>{products.length}</b></div><div><ShoppingBag/><small>Orders</small><b>{orders.length}</b></div><div><Package/><small>Pending</small><b>{orders.filter(o=>o.status==="pending").length}</b></div></div>
    <div className="admin-grid"><section className="panel"><h2>Add product</h2><form onSubmit={save}><label>Product name<input required value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/></label><label>Category<input value={draft.category} onChange={e=>setDraft({...draft,category:e.target.value})}/></label><div className="two-fields"><label>Sale price (PKR)<input required type="number" min="1" value={draft.price} onChange={e=>setDraft({...draft,price:e.target.value})}/></label><label>Original price<input type="number" min="0" value={draft.compare_at} onChange={e=>setDraft({...draft,compare_at:e.target.value})}/></label></div><label>Image URL<input value={draft.image_url} onChange={e=>setDraft({...draft,image_url:e.target.value})} placeholder="https://..."/></label><label>Description<textarea rows="3" value={draft.description} onChange={e=>setDraft({...draft,description:e.target.value})}/></label><button className="button"><Plus size={16}/> Add product</button></form></section>
    <section className="panel"><h2>Products ({products.length})</h2>{products.map(p=><div className="admin-row" key={p.id}><span>{p.name}<small>{money(p.price)}</small></span><button className="icon-btn danger" onClick={()=>remove(p.id)}><Trash2 size={16}/></button></div>)}</section></div>
    <section className="panel orders-panel"><h2>Customer orders ({orders.length})</h2>{orders.length===0?<p className="muted">No orders yet.</p>:orders.map(o=><div className="order-row" key={o.id}><div><b>{o.customer_name}</b><small>{o.phone} · {o.city} · {money(o.total)}</small><small>{o.address}</small></div><select value={o.status} onChange={e=>updateStatus(o.id,e.target.value)}><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option></select></div>)}</section>
    {notice&&<p className="notice">{notice}</p>}</main>;
}

export default function App() {
  const products=useProducts(); const [cart,setCart]=useState([]);
  const count=cart.reduce((s,x)=>s+x.qty,0);
  function add(p){setCart(old=>{const found=old.find(x=>x.id===p.id);return found?old.map(x=>x.id===p.id?{...x,qty:x.qty+1}:x):[...old,{...p,qty:1}];});}
  function clear(){setCart([]);}
  return <div className="app-shell"><Header count={count}/><Routes><Route path="/" element={<Home products={products} add={add}/>}/><Route path="/checkout" element={<Checkout cart={cart} clear={clear}/>}/><Route path="/admin" element={<Admin/>}/><Route path="*" element={<main className="section"><h1>Page not found</h1><Link to="/">Back home</Link></main>}/></Routes>
    <footer className="footer"><Link to="/" className="brand"><span className="brand-mark">TZ</span><span>TECH<span className="purple">ZEN</span><small>TECH MADE EASY</small></span></Link><p>Shop smart. Live better.</p><small>© {new Date().getFullYear()} TechZen. Product availability and delivery are confirmed before dispatch.</small></footer>
    {cart.length>0&&<div className="cart-dock"><div><b>{count} item(s)</b><small>{money(cart.reduce((s,x)=>s+x.price*x.qty,0))}</small></div><Link className="button" to="/checkout">Checkout</Link></div>}
  </div>;
}