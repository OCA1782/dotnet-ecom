using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Ecom.API.Filters;

public class ValidationExceptionFilter : IExceptionFilter
{
    public void OnException(ExceptionContext context)
    {
        if (context.Exception is not ValidationException ex) return;

        var error = string.Join(" ", ex.Errors.Select(e => e.ErrorMessage).Distinct());

        context.Result = new BadRequestObjectResult(new { error });
        context.ExceptionHandled = true;
    }
}
