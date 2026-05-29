using Ecom.Application.Common.Interfaces;
using Ecom.Domain.Entities;
using Ecom.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Ecom.API.Controllers.Admin;

[ApiController]
[Route("api/admin/seed")]
[Authorize(Roles = "SuperAdmin")]
public class SeedController(IApplicationDbContext db) : ControllerBase
{
    [HttpPost("returns")]
    public async Task<IActionResult> SeedReturns(CancellationToken ct)
    {
        var addressSnapshot = """{"addressTitle":"Test Adres","firstName":"Test","lastName":"Müşteri","phoneNumber":"05001234567","country":"TR","city":"İstanbul","district":"Kadıköy","neighborhood":"Moda","fullAddress":"Test Sokak No:1","postalCode":"34710"}""";

        var testOrders = new List<Order>();
        for (int i = 1; i <= 3; i++)
        {
            var order = new Order
            {
                OrderNumber = $"TEST-RET-{DateTime.UtcNow:yyyyMMdd}-{i:D3}",
                Status = OrderStatus.RefundRequested,
                PaymentStatus = PaymentStatus.Paid,
                ShipmentStatus = ShipmentStatus.Delivered,
                TotalProductAmount = 100m * i,
                TaxAmount = 18m * i,
                GrandTotal = 118m * i,
                ShippingAddressSnapshot = addressSnapshot,
                BillingAddressSnapshot = addressSnapshot,
                Note = $"Test iade talebi #{i}",
            };
            order.Items.Add(new OrderItem
            {
                ProductId = Guid.NewGuid(),
                ProductName = $"Test Ürün {i}",
                SKU = $"TEST-{i:D3}",
                Quantity = i,
                UnitPrice = 100m,
                TaxRate = 18m,
                TaxAmount = 18m * i,
                LineTotal = 118m * i,
            });
            testOrders.Add(order);
        }

        db.Orders.AddRange(testOrders);
        await db.SaveChangesAsync(ct);

        return Ok(new { message = $"{testOrders.Count} test iade kaydı oluşturuldu.", ids = testOrders.Select(o => o.Id) });
    }

    [HttpPost("invoices")]
    public async Task<IActionResult> SeedInvoices(CancellationToken ct)
    {
        var addressSnapshot = """{"addressTitle":"Fatura Adresi","firstName":"Test","lastName":"Müşteri","phoneNumber":"05001234567","country":"TR","city":"İstanbul","district":"Şişli","neighborhood":"Nişantaşı","fullAddress":"Test Cad. No:5","postalCode":"34367"}""";

        var testOrders = new List<Order>();
        for (int i = 1; i <= 3; i++)
        {
            var order = new Order
            {
                OrderNumber = $"TEST-INV-{DateTime.UtcNow:yyyyMMdd}-{i:D3}",
                Status = OrderStatus.Completed,
                PaymentStatus = PaymentStatus.Paid,
                ShipmentStatus = ShipmentStatus.Delivered,
                TotalProductAmount = 200m * i,
                TaxAmount = 36m * i,
                GrandTotal = 236m * i,
                ShippingAddressSnapshot = addressSnapshot,
                BillingAddressSnapshot = addressSnapshot,
            };
            order.Items.Add(new OrderItem
            {
                ProductId = Guid.NewGuid(),
                ProductName = $"Fatura Ürünü {i}",
                SKU = $"INV-PRD-{i:D3}",
                Quantity = i,
                UnitPrice = 200m,
                TaxRate = 18m,
                TaxAmount = 36m * i,
                LineTotal = 236m * i,
            });
            testOrders.Add(order);
        }

        db.Orders.AddRange(testOrders);
        await db.SaveChangesAsync(ct);

        var invoices = new List<Invoice>();
        var docTypes = new[] { EInvoiceDocType.eArchive, EInvoiceDocType.eInvoice, EInvoiceDocType.eArchive };
        var statuses = new[] { InvoiceStatus.Draft, InvoiceStatus.Pending, InvoiceStatus.Sent };

        for (int i = 0; i < 3; i++)
        {
            var order = testOrders[i];
            var invoice = new Invoice
            {
                InvoiceNumber = $"FT-{DateTime.UtcNow:yyyyMMdd}-{i + 1:D4}",
                OrderId = order.Id,
                DocType = docTypes[i],
                Status = statuses[i],
                SubTotal = order.TotalProductAmount,
                TaxAmount = order.TaxAmount,
                TotalAmount = order.GrandTotal,
                BillingAddressSnapshot = addressSnapshot,
                SentDate = statuses[i] == InvoiceStatus.Sent ? DateTime.UtcNow.AddDays(-1) : null,
            };
            invoice.Items.Add(new InvoiceItem
            {
                ProductName = $"Fatura Ürünü {i + 1}",
                SKU = $"INV-PRD-{i + 1:D3}",
                Quantity = i + 1,
                UnitPrice = 200m,
                TaxRate = 18m,
                TaxAmount = 36m * (i + 1),
                LineTotal = 236m * (i + 1),
            });
            invoices.Add(invoice);
        }

        db.Invoices.AddRange(invoices);
        await db.SaveChangesAsync(ct);

        return Ok(new { message = $"{invoices.Count} test fatura oluşturuldu.", ids = invoices.Select(inv => inv.Id) });
    }

    [HttpPost("guest-orders")]
    public async Task<IActionResult> SeedGuestOrders(CancellationToken ct)
    {
        var addressSnapshot = """{"addressTitle":"Misafir Adres","firstName":"Misafir","lastName":"Kullanıcı","phoneNumber":"05001234567","country":"TR","city":"İstanbul","district":"Şişli","neighborhood":"Nişantaşı","fullAddress":"Misafir Cad. No:10","postalCode":"34367"}""";

        var guestEmail = $"misafir-test-{DateTime.UtcNow:yyyyMMddHHmm}@test.com";

        var order = new Order
        {
            OrderNumber   = $"GUEST-{DateTime.UtcNow:yyyyMMddHHmm}-001",
            GuestEmail    = guestEmail,
            Status        = OrderStatus.PaymentCompleted,
            PaymentStatus = PaymentStatus.Paid,
            ShipmentStatus = ShipmentStatus.Preparing,
            TotalProductAmount = 299m,
            TaxAmount          = 53.82m,
            GrandTotal         = 299m,
            ShippingAddressSnapshot = addressSnapshot,
            BillingAddressSnapshot  = addressSnapshot,
            Note = "Misafir test siparişi",
        };
        order.Items.Add(new OrderItem
        {
            ProductId   = Guid.NewGuid(),
            ProductName = "Test Ürün (Misafir)",
            SKU         = "GUEST-001",
            Quantity    = 1,
            UnitPrice   = 299m,
            TaxRate     = 18m,
            TaxAmount   = 53.82m,
            LineTotal   = 299m,
        });

        db.Orders.Add(order);
        await db.SaveChangesAsync(ct);

        return Ok(new
        {
            message    = "1 misafir siparişi oluşturuldu.",
            id         = order.Id,
            orderNumber = order.OrderNumber,
            guestEmail,
        });
    }
}
