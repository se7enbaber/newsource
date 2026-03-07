using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AdministrationService.Migrations
{
    /// <inheritdoc />
    public partial class MultiTenantUserNameIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "UserNameIndex",
                table: "ADMIN_Users");

            migrationBuilder.CreateIndex(
                name: "UserNameIndex",
                table: "ADMIN_Users",
                columns: new[] { "NormalizedUserName", "TenantId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "UserNameIndex",
                table: "ADMIN_Users");

            migrationBuilder.CreateIndex(
                name: "UserNameIndex",
                table: "ADMIN_Users",
                column: "NormalizedUserName",
                unique: true);
        }
    }
}
