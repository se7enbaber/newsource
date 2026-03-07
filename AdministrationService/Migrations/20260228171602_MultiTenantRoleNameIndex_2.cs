using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AdministrationService.Migrations
{
    /// <inheritdoc />
    public partial class MultiTenantRoleNameIndex_2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "RoleNameIndex",
                table: "ADMIN_Roles");

            migrationBuilder.CreateIndex(
                name: "RoleNameIndex",
                table: "ADMIN_Roles",
                columns: new[] { "NormalizedName", "TenantId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "RoleNameIndex",
                table: "ADMIN_Roles");

            migrationBuilder.CreateIndex(
                name: "RoleNameIndex",
                table: "ADMIN_Roles",
                column: "NormalizedName",
                unique: true);
        }
    }
}
