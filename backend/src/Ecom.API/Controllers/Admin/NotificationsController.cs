using Ecom.Application.Features.Admin.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecom.API.Controllers.Admin;

[ApiController]
[Route("api/admin/notifications")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class NotificationsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
        => Ok(await mediator.Send(new GetNotificationsQuery(), ct));
}
