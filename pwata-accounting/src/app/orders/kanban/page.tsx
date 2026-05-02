"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { toast } from "sonner";
import OrderCard from "@/components/OrderCard";

interface Order {
  id: string;
  order_number: string;
  customer_name?: string;
  guest_name?: string;
  guest_phone?: string;
  total_amount: number;
  status: string;
  created_at: string;
  items?: Array<{
    product_name: string;
    quantity: number;
    customizations?: string;
  }>;
}

const COLUMNS = [
  { id: "pending", title: "Pending" },
  { id: "in_design", title: "In Design" },
  { id: "printing", title: "Printing" },
  { id: "ready_for_delivery", title: "Ready" },
  { id: "completed", title: "Completed" },
];

export default function OrdersKanbanPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders");
      const data = await response.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result: { source: { droppableId: string }; destination: { droppableId: string } | null; draggableId: string }) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) return;

    const newStatus = destination.droppableId;
    const orderId = draggableId;

    const previousOrders = [...orders];
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update order");

      toast.success("Order status updated");
      fetchOrders();
    } catch {
      setOrders(previousOrders);
      toast.error("Failed to update order status");
    }
  };

  const getOrdersByStatus = (status: string) => orders.filter((o) => o.status === status);

  return (
    <div className="container">
      <header style={{ padding: "1.5rem 0 1rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Orders Kanban</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>{orders.length} orders</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <div style={{ display: "inline-flex", border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden" }}>
            <Link href="/orders" style={{ padding: "0.5rem 0.875rem", color: "var(--text-muted)", textDecoration: "none", fontSize: "0.875rem", fontWeight: 600 }}>List</Link>
            <span style={{ padding: "0.5rem 0.875rem", background: "var(--primary)", color: "white", fontSize: "0.875rem", fontWeight: 600 }}>Kanban</span>
          </div>
          <Link href="/orders/new" className="btn btn-primary">+ New Order</Link>
        </div>
      </header>

      {loading ? (
        <p style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>Loading orders…</p>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div style={{ display: "flex", gap: "1rem", overflowX: "auto", paddingBottom: "1rem" }}>
            {COLUMNS.map((column) => {
              const columnOrders = getOrdersByStatus(column.id);
              return (
                <div key={column.id} style={{ minWidth: "280px", background: "var(--bg-card)", borderRadius: "0.5rem", padding: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "1px solid var(--border)" }}>
                    <h2 style={{ fontSize: "0.95rem", fontWeight: 600 }}>{column.title}</h2>
                    <span style={{ background: "var(--bg)", borderRadius: "9999px", padding: "0.15rem 0.5rem", fontSize: "0.75rem", fontWeight: 600 }}>
                      {columnOrders.length}
                    </span>
                  </div>

                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        style={{
                          minHeight: "200px",
                          background: snapshot.isDraggingOver ? "var(--bg-input)" : "transparent",
                          borderRadius: "0.25rem",
                          transition: "background 0.2s",
                        }}
                      >
                        {columnOrders.map((order, index) => (
                          <Draggable key={order.id} draggableId={order.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={{ ...provided.draggableProps.style, opacity: snapshot.isDragging ? 0.8 : 1 }}
                              >
                                <Link href={`/orders/${order.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                                  <OrderCard order={order} />
                                </Link>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {columnOrders.length === 0 && (
                          <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "1.5rem 1rem", fontSize: "0.8rem" }}>
                            No orders
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      )}
    </div>
  );
}
