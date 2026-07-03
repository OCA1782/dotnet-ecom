IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'opel' AND IsDeleted = 0)
BEGIN
    INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
    VALUES ('1BEBA035-5AB8-46A2-BCC4-30F52BA9150E', N'Opel', 'opel', NULL, NULL, NULL, 0, 1, 1, 1, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
ELSE
BEGIN
    -- Varsa ShowInVehicleNav=true gÃ¼ncelle
    UPDATE Categories SET ShowInVehicleNav = 1 WHERE Slug = 'opel' AND IsDeleted = 0
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'opel-astra-f' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_90EE9271A538469E977E41C9C3E23364 uniqueidentifier
    SELECT @parentId_90EE9271A538469E977E41C9C3E23364 = Id FROM Categories WHERE Slug = 'opel' AND IsDeleted = 0
    IF @parentId_90EE9271A538469E977E41C9C3E23364 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('90EE9271-A538-469E-977E-41C9C3E23364', N'Astra F', 'opel-astra-f', @parentId_90EE9271A538469E977E41C9C3E23364, NULL, NULL, 0, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'opel-astra-g' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_3CDF970AE1D641C1BC8DAC856E3089E6 uniqueidentifier
    SELECT @parentId_3CDF970AE1D641C1BC8DAC856E3089E6 = Id FROM Categories WHERE Slug = 'opel' AND IsDeleted = 0
    IF @parentId_3CDF970AE1D641C1BC8DAC856E3089E6 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('3CDF970A-E1D6-41C1-BC8D-AC856E3089E6', N'Astra G', 'opel-astra-g', @parentId_3CDF970AE1D641C1BC8DAC856E3089E6, NULL, NULL, 1, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'opel-astra-h' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_0FDA77DE6BDB48B582E370301006A39B uniqueidentifier
    SELECT @parentId_0FDA77DE6BDB48B582E370301006A39B = Id FROM Categories WHERE Slug = 'opel' AND IsDeleted = 0
    IF @parentId_0FDA77DE6BDB48B582E370301006A39B IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('0FDA77DE-6BDB-48B5-82E3-70301006A39B', N'Astra H', 'opel-astra-h', @parentId_0FDA77DE6BDB48B582E370301006A39B, NULL, NULL, 2, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'opel-astra-j' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_F1FC660563A94ACF83DC8A299BA3368E uniqueidentifier
    SELECT @parentId_F1FC660563A94ACF83DC8A299BA3368E = Id FROM Categories WHERE Slug = 'opel' AND IsDeleted = 0
    IF @parentId_F1FC660563A94ACF83DC8A299BA3368E IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('F1FC6605-63A9-4ACF-83DC-8A299BA3368E', N'Astra J', 'opel-astra-j', @parentId_F1FC660563A94ACF83DC8A299BA3368E, NULL, NULL, 3, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'opel-astra-k' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_A3640606342C4D2F8CA989C960E4EB28 uniqueidentifier
    SELECT @parentId_A3640606342C4D2F8CA989C960E4EB28 = Id FROM Categories WHERE Slug = 'opel' AND IsDeleted = 0
    IF @parentId_A3640606342C4D2F8CA989C960E4EB28 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('A3640606-342C-4D2F-8CA9-89C960E4EB28', N'Astra K', 'opel-astra-k', @parentId_A3640606342C4D2F8CA989C960E4EB28, NULL, NULL, 4, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'opel-corsa-a' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_A43F52EB179A4E19B5F005F54DF290F2 uniqueidentifier
    SELECT @parentId_A43F52EB179A4E19B5F005F54DF290F2 = Id FROM Categories WHERE Slug = 'opel' AND IsDeleted = 0
    IF @parentId_A43F52EB179A4E19B5F005F54DF290F2 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('A43F52EB-179A-4E19-B5F0-05F54DF290F2', N'Corsa A', 'opel-corsa-a', @parentId_A43F52EB179A4E19B5F005F54DF290F2, NULL, NULL, 5, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'opel-corsa-b' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_9E4EEAE7D2174DB68E7C942C83DECDD0 uniqueidentifier
    SELECT @parentId_9E4EEAE7D2174DB68E7C942C83DECDD0 = Id FROM Categories WHERE Slug = 'opel' AND IsDeleted = 0
    IF @parentId_9E4EEAE7D2174DB68E7C942C83DECDD0 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('9E4EEAE7-D217-4DB6-8E7C-942C83DECDD0', N'Corsa B', 'opel-corsa-b', @parentId_9E4EEAE7D2174DB68E7C942C83DECDD0, NULL, NULL, 6, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'opel-corsa-c' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_E0669442A87040D3B69EB72EB4BAE9D7 uniqueidentifier
    SELECT @parentId_E0669442A87040D3B69EB72EB4BAE9D7 = Id FROM Categories WHERE Slug = 'opel' AND IsDeleted = 0
    IF @parentId_E0669442A87040D3B69EB72EB4BAE9D7 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('E0669442-A870-40D3-B69E-B72EB4BAE9D7', N'Corsa C', 'opel-corsa-c', @parentId_E0669442A87040D3B69EB72EB4BAE9D7, NULL, NULL, 7, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'opel-corsa-d' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_825CB61989C948A480C183AD698A6671 uniqueidentifier
    SELECT @parentId_825CB61989C948A480C183AD698A6671 = Id FROM Categories WHERE Slug = 'opel' AND IsDeleted = 0
    IF @parentId_825CB61989C948A480C183AD698A6671 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('825CB619-89C9-48A4-80C1-83AD698A6671', N'Corsa D', 'opel-corsa-d', @parentId_825CB61989C948A480C183AD698A6671, NULL, NULL, 8, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'opel-corsa-e' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_7DE47ACD88DC4F9F94602A78F5A92B5D uniqueidentifier
    SELECT @parentId_7DE47ACD88DC4F9F94602A78F5A92B5D = Id FROM Categories WHERE Slug = 'opel' AND IsDeleted = 0
    IF @parentId_7DE47ACD88DC4F9F94602A78F5A92B5D IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('7DE47ACD-88DC-4F9F-9460-2A78F5A92B5D', N'Corsa E', 'opel-corsa-e', @parentId_7DE47ACD88DC4F9F94602A78F5A92B5D, NULL, NULL, 9, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'opel-corsa-f' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_49879CB2EE0C4C0291C1693F5B979BA1 uniqueidentifier
    SELECT @parentId_49879CB2EE0C4C0291C1693F5B979BA1 = Id FROM Categories WHERE Slug = 'opel' AND IsDeleted = 0
    IF @parentId_49879CB2EE0C4C0291C1693F5B979BA1 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('49879CB2-EE0C-4C02-91C1-693F5B979BA1', N'Corsa F', 'opel-corsa-f', @parentId_49879CB2EE0C4C0291C1693F5B979BA1, NULL, NULL, 10, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'opel-zafira-a' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_1C07B2D461654837AA45DD5A92A93A2B uniqueidentifier
    SELECT @parentId_1C07B2D461654837AA45DD5A92A93A2B = Id FROM Categories WHERE Slug = 'opel' AND IsDeleted = 0
    IF @parentId_1C07B2D461654837AA45DD5A92A93A2B IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('1C07B2D4-6165-4837-AA45-DD5A92A93A2B', N'Zafira A', 'opel-zafira-a', @parentId_1C07B2D461654837AA45DD5A92A93A2B, NULL, NULL, 11, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'opel-zafira-b' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_8AAE22FAB4CD4732973A43AA20B3B0EC uniqueidentifier
    SELECT @parentId_8AAE22FAB4CD4732973A43AA20B3B0EC = Id FROM Categories WHERE Slug = 'opel' AND IsDeleted = 0
    IF @parentId_8AAE22FAB4CD4732973A43AA20B3B0EC IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('8AAE22FA-B4CD-4732-973A-43AA20B3B0EC', N'Zafira B', 'opel-zafira-b', @parentId_8AAE22FAB4CD4732973A43AA20B3B0EC, NULL, NULL, 12, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'opel-zafira-c' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_A6F0350726124FFEB7AC694832A51DC5 uniqueidentifier
    SELECT @parentId_A6F0350726124FFEB7AC694832A51DC5 = Id FROM Categories WHERE Slug = 'opel' AND IsDeleted = 0
    IF @parentId_A6F0350726124FFEB7AC694832A51DC5 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('A6F03507-2612-4FFE-B7AC-694832A51DC5', N'Zafira C', 'opel-zafira-c', @parentId_A6F0350726124FFEB7AC694832A51DC5, NULL, NULL, 13, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'opel-combo-b' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_BC45728077D64BD58966DBC5ABFF1AEC uniqueidentifier
    SELECT @parentId_BC45728077D64BD58966DBC5ABFF1AEC = Id FROM Categories WHERE Slug = 'opel' AND IsDeleted = 0
    IF @parentId_BC45728077D64BD58966DBC5ABFF1AEC IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('BC457280-77D6-4BD5-8966-DBC5ABFF1AEC', N'Combo B', 'opel-combo-b', @parentId_BC45728077D64BD58966DBC5ABFF1AEC, NULL, NULL, 14, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'opel-combo-c' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_29C3F1713C88498E9C901D6AA77A8077 uniqueidentifier
    SELECT @parentId_29C3F1713C88498E9C901D6AA77A8077 = Id FROM Categories WHERE Slug = 'opel' AND IsDeleted = 0
    IF @parentId_29C3F1713C88498E9C901D6AA77A8077 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('29C3F171-3C88-498E-9C90-1D6AA77A8077', N'Combo C', 'opel-combo-c', @parentId_29C3F1713C88498E9C901D6AA77A8077, NULL, NULL, 15, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'opel-combo-d' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_F6B493C6E1D64A999A27CA995D959221 uniqueidentifier
    SELECT @parentId_F6B493C6E1D64A999A27CA995D959221 = Id FROM Categories WHERE Slug = 'opel' AND IsDeleted = 0
    IF @parentId_F6B493C6E1D64A999A27CA995D959221 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('F6B493C6-E1D6-4A99-9A27-CA995D959221', N'Combo D', 'opel-combo-d', @parentId_F6B493C6E1D64A999A27CA995D959221, NULL, NULL, 16, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'opel-combo-e' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_5220B354816444CCA6489BF776BD78AF uniqueidentifier
    SELECT @parentId_5220B354816444CCA6489BF776BD78AF = Id FROM Categories WHERE Slug = 'opel' AND IsDeleted = 0
    IF @parentId_5220B354816444CCA6489BF776BD78AF IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('5220B354-8164-44CC-A648-9BF776BD78AF', N'Combo E', 'opel-combo-e', @parentId_5220B354816444CCA6489BF776BD78AF, NULL, NULL, 17, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'opel-insignia-a' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_5DC79B9C51FD4688896222290F422DEF uniqueidentifier
    SELECT @parentId_5DC79B9C51FD4688896222290F422DEF = Id FROM Categories WHERE Slug = 'opel' AND IsDeleted = 0
    IF @parentId_5DC79B9C51FD4688896222290F422DEF IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('5DC79B9C-51FD-4688-8962-22290F422DEF', N'Insignia A', 'opel-insignia-a', @parentId_5DC79B9C51FD4688896222290F422DEF, NULL, NULL, 18, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'opel-insignia-b' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_092C6B3C48584394976CC14DC82EFF0C uniqueidentifier
    SELECT @parentId_092C6B3C48584394976CC14DC82EFF0C = Id FROM Categories WHERE Slug = 'opel' AND IsDeleted = 0
    IF @parentId_092C6B3C48584394976CC14DC82EFF0C IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('092C6B3C-4858-4394-976C-C14DC82EFF0C', N'Insignia B', 'opel-insignia-b', @parentId_092C6B3C48584394976CC14DC82EFF0C, NULL, NULL, 19, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'opel-vectra-a' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_41522AF6D36C41CF8512ED26FD802BF4 uniqueidentifier
    SELECT @parentId_41522AF6D36C41CF8512ED26FD802BF4 = Id FROM Categories WHERE Slug = 'opel' AND IsDeleted = 0
    IF @parentId_41522AF6D36C41CF8512ED26FD802BF4 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('41522AF6-D36C-41CF-8512-ED26FD802BF4', N'Vectra A', 'opel-vectra-a', @parentId_41522AF6D36C41CF8512ED26FD802BF4, NULL, NULL, 20, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'opel-vectra-b' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_1A3B5B109DA344DB8D409480E7AD89C9 uniqueidentifier
    SELECT @parentId_1A3B5B109DA344DB8D409480E7AD89C9 = Id FROM Categories WHERE Slug = 'opel' AND IsDeleted = 0
    IF @parentId_1A3B5B109DA344DB8D409480E7AD89C9 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('1A3B5B10-9DA3-44DB-8D40-9480E7AD89C9', N'Vectra B', 'opel-vectra-b', @parentId_1A3B5B109DA344DB8D409480E7AD89C9, NULL, NULL, 21, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'opel-vectra-c' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_6D24166AA3F84ABCB66735EB5BA438CC uniqueidentifier
    SELECT @parentId_6D24166AA3F84ABCB66735EB5BA438CC = Id FROM Categories WHERE Slug = 'opel' AND IsDeleted = 0
    IF @parentId_6D24166AA3F84ABCB66735EB5BA438CC IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('6D24166A-A3F8-4ABC-B667-35EB5BA438CC', N'Vectra C', 'opel-vectra-c', @parentId_6D24166AA3F84ABCB66735EB5BA438CC, NULL, NULL, 22, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'opel-omega-a' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_C5444A7701FF4A96AFFA7BF9398A5927 uniqueidentifier
    SELECT @parentId_C5444A7701FF4A96AFFA7BF9398A5927 = Id FROM Categories WHERE Slug = 'opel' AND IsDeleted = 0
    IF @parentId_C5444A7701FF4A96AFFA7BF9398A5927 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('C5444A77-01FF-4A96-AFFA-7BF9398A5927', N'Omega A', 'opel-omega-a', @parentId_C5444A7701FF4A96AFFA7BF9398A5927, NULL, NULL, 23, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'opel-omega-b' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_0C99BDF52A97478A97BF1E6326BFFC62 uniqueidentifier
    SELECT @parentId_0C99BDF52A97478A97BF1E6326BFFC62 = Id FROM Categories WHERE Slug = 'opel' AND IsDeleted = 0
    IF @parentId_0C99BDF52A97478A97BF1E6326BFFC62 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('0C99BDF5-2A97-478A-97BF-1E6326BFFC62', N'Omega B', 'opel-omega-b', @parentId_0C99BDF52A97478A97BF1E6326BFFC62, NULL, NULL, 24, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'opel-meriva-a' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_9B69E8B97BFB43E6BD712A9D8061C2D1 uniqueidentifier
    SELECT @parentId_9B69E8B97BFB43E6BD712A9D8061C2D1 = Id FROM Categories WHERE Slug = 'opel' AND IsDeleted = 0
    IF @parentId_9B69E8B97BFB43E6BD712A9D8061C2D1 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('9B69E8B9-7BFB-43E6-BD71-2A9D8061C2D1', N'Meriva A', 'opel-meriva-a', @parentId_9B69E8B97BFB43E6BD712A9D8061C2D1, NULL, NULL, 25, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'opel-meriva-b' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_B6252372D09549B5A9346A546B302406 uniqueidentifier
    SELECT @parentId_B6252372D09549B5A9346A546B302406 = Id FROM Categories WHERE Slug = 'opel' AND IsDeleted = 0
    IF @parentId_B6252372D09549B5A9346A546B302406 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('B6252372-D095-49B5-A934-6A546B302406', N'Meriva B', 'opel-meriva-b', @parentId_B6252372D09549B5A9346A546B302406, NULL, NULL, 26, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'opel-mokka' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_F9CBCC7B82844D7C96955CB11E66D942 uniqueidentifier
    SELECT @parentId_F9CBCC7B82844D7C96955CB11E66D942 = Id FROM Categories WHERE Slug = 'opel' AND IsDeleted = 0
    IF @parentId_F9CBCC7B82844D7C96955CB11E66D942 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('F9CBCC7B-8284-4D7C-9695-5CB11E66D942', N'Mokka', 'opel-mokka', @parentId_F9CBCC7B82844D7C96955CB11E66D942, NULL, NULL, 27, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'opel-mokka-x' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_7329628D410E49B4ACA27D063640B2D5 uniqueidentifier
    SELECT @parentId_7329628D410E49B4ACA27D063640B2D5 = Id FROM Categories WHERE Slug = 'opel' AND IsDeleted = 0
    IF @parentId_7329628D410E49B4ACA27D063640B2D5 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('7329628D-410E-49B4-ACA2-7D063640B2D5', N'Mokka X', 'opel-mokka-x', @parentId_7329628D410E49B4ACA27D063640B2D5, NULL, NULL, 28, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'opel-crossland-x' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_A6F0563C52B7431FBB175170DF6F16FF uniqueidentifier
    SELECT @parentId_A6F0563C52B7431FBB175170DF6F16FF = Id FROM Categories WHERE Slug = 'opel' AND IsDeleted = 0
    IF @parentId_A6F0563C52B7431FBB175170DF6F16FF IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('A6F0563C-52B7-431F-BB17-5170DF6F16FF', N'Crossland X', 'opel-crossland-x', @parentId_A6F0563C52B7431FBB175170DF6F16FF, NULL, NULL, 29, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'opel-grandland-x' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_19FC7E74B574416FB00AA857BB1A1536 uniqueidentifier
    SELECT @parentId_19FC7E74B574416FB00AA857BB1A1536 = Id FROM Categories WHERE Slug = 'opel' AND IsDeleted = 0
    IF @parentId_19FC7E74B574416FB00AA857BB1A1536 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('19FC7E74-B574-416F-B00A-A857BB1A1536', N'Grandland X', 'opel-grandland-x', @parentId_19FC7E74B574416FB00AA857BB1A1536, NULL, NULL, 30, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'opel-kadett-e' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_45E0C5186BD74CC38D1EF4165079CF18 uniqueidentifier
    SELECT @parentId_45E0C5186BD74CC38D1EF4165079CF18 = Id FROM Categories WHERE Slug = 'opel' AND IsDeleted = 0
    IF @parentId_45E0C5186BD74CC38D1EF4165079CF18 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('45E0C518-6BD7-4CC3-8D1E-F4165079CF18', N'Kadett E', 'opel-kadett-e', @parentId_45E0C5186BD74CC38D1EF4165079CF18, NULL, NULL, 31, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'opel-antara' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_9A3857F0B41B415EB3FCE4647A3AB5B9 uniqueidentifier
    SELECT @parentId_9A3857F0B41B415EB3FCE4647A3AB5B9 = Id FROM Categories WHERE Slug = 'opel' AND IsDeleted = 0
    IF @parentId_9A3857F0B41B415EB3FCE4647A3AB5B9 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('9A3857F0-B41B-415E-B3FC-E4647A3AB5B9', N'Antara', 'opel-antara', @parentId_9A3857F0B41B415EB3FCE4647A3AB5B9, NULL, NULL, 32, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'opel-adam' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_3C1A0655409D49E29B1B9C73538E58E7 uniqueidentifier
    SELECT @parentId_3C1A0655409D49E29B1B9C73538E58E7 = Id FROM Categories WHERE Slug = 'opel' AND IsDeleted = 0
    IF @parentId_3C1A0655409D49E29B1B9C73538E58E7 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('3C1A0655-409D-49E2-9B1B-9C73538E58E7', N'Adam', 'opel-adam', @parentId_3C1A0655409D49E29B1B9C73538E58E7, NULL, NULL, 33, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'opel-agila-b' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_FC48CA5F120546B2A231BED0339AA543 uniqueidentifier
    SELECT @parentId_FC48CA5F120546B2A231BED0339AA543 = Id FROM Categories WHERE Slug = 'opel' AND IsDeleted = 0
    IF @parentId_FC48CA5F120546B2A231BED0339AA543 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('FC48CA5F-1205-46B2-A231-BED0339AA543', N'Agila B', 'opel-agila-b', @parentId_FC48CA5F120546B2A231BED0339AA543, NULL, NULL, 34, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'opel-signum' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_0D6C633383A74C85B57A9193D0114C1C uniqueidentifier
    SELECT @parentId_0D6C633383A74C85B57A9193D0114C1C = Id FROM Categories WHERE Slug = 'opel' AND IsDeleted = 0
    IF @parentId_0D6C633383A74C85B57A9193D0114C1C IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('0D6C6333-83A7-4C85-B57A-9193D0114C1C', N'Signum', 'opel-signum', @parentId_0D6C633383A74C85B57A9193D0114C1C, NULL, NULL, 35, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'opel-cascada' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_C77413686FFD47D1906D2842F539BED8 uniqueidentifier
    SELECT @parentId_C77413686FFD47D1906D2842F539BED8 = Id FROM Categories WHERE Slug = 'opel' AND IsDeleted = 0
    IF @parentId_C77413686FFD47D1906D2842F539BED8 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('C7741368-6FFD-47D1-906D-2842F539BED8', N'Cascada', 'opel-cascada', @parentId_C77413686FFD47D1906D2842F539BED8, NULL, NULL, 36, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'chevrolet' AND IsDeleted = 0)
BEGIN
    INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
    VALUES ('D34E8F31-C568-4FF0-91D8-C5535F42B00E', N'Chevrolet', 'chevrolet', NULL, NULL, NULL, 1, 1, 1, 1, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
ELSE
BEGIN
    -- Varsa ShowInVehicleNav=true gÃ¼ncelle
    UPDATE Categories SET ShowInVehicleNav = 1 WHERE Slug = 'chevrolet' AND IsDeleted = 0
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'chevrolet-aveo-t200' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_EA6EB886FC2E4ABAB7FAEE59826FFD05 uniqueidentifier
    SELECT @parentId_EA6EB886FC2E4ABAB7FAEE59826FFD05 = Id FROM Categories WHERE Slug = 'chevrolet' AND IsDeleted = 0
    IF @parentId_EA6EB886FC2E4ABAB7FAEE59826FFD05 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('EA6EB886-FC2E-4ABA-B7FA-EE59826FFD05', N'Aveo T200', 'chevrolet-aveo-t200', @parentId_EA6EB886FC2E4ABAB7FAEE59826FFD05, NULL, NULL, 0, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'chevrolet-aveo-t250' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_C9FB0E74E0BE4288BEBA788B3626C4FD uniqueidentifier
    SELECT @parentId_C9FB0E74E0BE4288BEBA788B3626C4FD = Id FROM Categories WHERE Slug = 'chevrolet' AND IsDeleted = 0
    IF @parentId_C9FB0E74E0BE4288BEBA788B3626C4FD IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('C9FB0E74-E0BE-4288-BEBA-788B3626C4FD', N'Aveo T250', 'chevrolet-aveo-t250', @parentId_C9FB0E74E0BE4288BEBA788B3626C4FD, NULL, NULL, 1, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'chevrolet-aveo-t300' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_6B39C024758044FAA830A3E94FA5F7C7 uniqueidentifier
    SELECT @parentId_6B39C024758044FAA830A3E94FA5F7C7 = Id FROM Categories WHERE Slug = 'chevrolet' AND IsDeleted = 0
    IF @parentId_6B39C024758044FAA830A3E94FA5F7C7 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('6B39C024-7580-44FA-A830-A3E94FA5F7C7', N'Aveo T300', 'chevrolet-aveo-t300', @parentId_6B39C024758044FAA830A3E94FA5F7C7, NULL, NULL, 2, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'chevrolet-cruze-j300' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_263C28EEFDF64771B8B3CEA3B28CB703 uniqueidentifier
    SELECT @parentId_263C28EEFDF64771B8B3CEA3B28CB703 = Id FROM Categories WHERE Slug = 'chevrolet' AND IsDeleted = 0
    IF @parentId_263C28EEFDF64771B8B3CEA3B28CB703 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('263C28EE-FDF6-4771-B8B3-CEA3B28CB703', N'Cruze J300', 'chevrolet-cruze-j300', @parentId_263C28EEFDF64771B8B3CEA3B28CB703, NULL, NULL, 3, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'chevrolet-cruze-j400' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_53E190602CE64F69A711573981E2089C uniqueidentifier
    SELECT @parentId_53E190602CE64F69A711573981E2089C = Id FROM Categories WHERE Slug = 'chevrolet' AND IsDeleted = 0
    IF @parentId_53E190602CE64F69A711573981E2089C IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('53E19060-2CE6-4F69-A711-573981E2089C', N'Cruze J400', 'chevrolet-cruze-j400', @parentId_53E190602CE64F69A711573981E2089C, NULL, NULL, 4, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'chevrolet-spark-m200' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_0CD1E95675C84E07A129539634DC25E7 uniqueidentifier
    SELECT @parentId_0CD1E95675C84E07A129539634DC25E7 = Id FROM Categories WHERE Slug = 'chevrolet' AND IsDeleted = 0
    IF @parentId_0CD1E95675C84E07A129539634DC25E7 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('0CD1E956-75C8-4E07-A129-539634DC25E7', N'Spark M200', 'chevrolet-spark-m200', @parentId_0CD1E95675C84E07A129539634DC25E7, NULL, NULL, 5, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'chevrolet-spark-m300' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_2CF4524F092B43BEA98B691CB9DBB64E uniqueidentifier
    SELECT @parentId_2CF4524F092B43BEA98B691CB9DBB64E = Id FROM Categories WHERE Slug = 'chevrolet' AND IsDeleted = 0
    IF @parentId_2CF4524F092B43BEA98B691CB9DBB64E IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('2CF4524F-092B-43BE-A98B-691CB9DBB64E', N'Spark M300', 'chevrolet-spark-m300', @parentId_2CF4524F092B43BEA98B691CB9DBB64E, NULL, NULL, 6, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'chevrolet-captiva-c100' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_87A83A293C1F4821937B666E3D60DA3C uniqueidentifier
    SELECT @parentId_87A83A293C1F4821937B666E3D60DA3C = Id FROM Categories WHERE Slug = 'chevrolet' AND IsDeleted = 0
    IF @parentId_87A83A293C1F4821937B666E3D60DA3C IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('87A83A29-3C1F-4821-937B-666E3D60DA3C', N'Captiva C100', 'chevrolet-captiva-c100', @parentId_87A83A293C1F4821937B666E3D60DA3C, NULL, NULL, 7, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'chevrolet-captiva-c140' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_0EC092D981774679A02B5BEB4DBD6298 uniqueidentifier
    SELECT @parentId_0EC092D981774679A02B5BEB4DBD6298 = Id FROM Categories WHERE Slug = 'chevrolet' AND IsDeleted = 0
    IF @parentId_0EC092D981774679A02B5BEB4DBD6298 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('0EC092D9-8177-4679-A02B-5BEB4DBD6298', N'Captiva C140', 'chevrolet-captiva-c140', @parentId_0EC092D981774679A02B5BEB4DBD6298, NULL, NULL, 8, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'chevrolet-lacetti' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_9476F94274374AEA8BECCCA194945E60 uniqueidentifier
    SELECT @parentId_9476F94274374AEA8BECCCA194945E60 = Id FROM Categories WHERE Slug = 'chevrolet' AND IsDeleted = 0
    IF @parentId_9476F94274374AEA8BECCCA194945E60 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('9476F942-7437-4AEA-8BEC-CCA194945E60', N'Lacetti', 'chevrolet-lacetti', @parentId_9476F94274374AEA8BECCCA194945E60, NULL, NULL, 9, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'chevrolet-epica' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_40FFDF6258634912A54AD9F70B96253C uniqueidentifier
    SELECT @parentId_40FFDF6258634912A54AD9F70B96253C = Id FROM Categories WHERE Slug = 'chevrolet' AND IsDeleted = 0
    IF @parentId_40FFDF6258634912A54AD9F70B96253C IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('40FFDF62-5863-4912-A54A-D9F70B96253C', N'Epica', 'chevrolet-epica', @parentId_40FFDF6258634912A54AD9F70B96253C, NULL, NULL, 10, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'chevrolet-trax' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_035322F3040F4814B9026495B76774DD uniqueidentifier
    SELECT @parentId_035322F3040F4814B9026495B76774DD = Id FROM Categories WHERE Slug = 'chevrolet' AND IsDeleted = 0
    IF @parentId_035322F3040F4814B9026495B76774DD IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('035322F3-040F-4814-B902-6495B76774DD', N'Trax', 'chevrolet-trax', @parentId_035322F3040F4814B9026495B76774DD, NULL, NULL, 11, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'chevrolet-orlando' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_9BE13BBB1E3C45C69B683545E46E4848 uniqueidentifier
    SELECT @parentId_9BE13BBB1E3C45C69B683545E46E4848 = Id FROM Categories WHERE Slug = 'chevrolet' AND IsDeleted = 0
    IF @parentId_9BE13BBB1E3C45C69B683545E46E4848 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('9BE13BBB-1E3C-45C6-9B68-3545E46E4848', N'Orlando', 'chevrolet-orlando', @parentId_9BE13BBB1E3C45C69B683545E46E4848, NULL, NULL, 12, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'chevrolet-malibu' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_F00C2CF91A0947F2B7FAF63E65E278F2 uniqueidentifier
    SELECT @parentId_F00C2CF91A0947F2B7FAF63E65E278F2 = Id FROM Categories WHERE Slug = 'chevrolet' AND IsDeleted = 0
    IF @parentId_F00C2CF91A0947F2B7FAF63E65E278F2 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('F00C2CF9-1A09-47F2-B7FA-F63E65E278F2', N'Malibu', 'chevrolet-malibu', @parentId_F00C2CF91A0947F2B7FAF63E65E278F2, NULL, NULL, 13, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'bmw' AND IsDeleted = 0)
BEGIN
    INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
    VALUES ('F99EBE2B-AF88-450D-BD86-94AD6377A707', N'BMW', 'bmw', NULL, NULL, NULL, 2, 1, 1, 1, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
ELSE
BEGIN
    -- Varsa ShowInVehicleNav=true gÃ¼ncelle
    UPDATE Categories SET ShowInVehicleNav = 1 WHERE Slug = 'bmw' AND IsDeleted = 0
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'bmw-1-serisi-e81' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_E75FF77FA0E041EA889BCD2DB296EC83 uniqueidentifier
    SELECT @parentId_E75FF77FA0E041EA889BCD2DB296EC83 = Id FROM Categories WHERE Slug = 'bmw' AND IsDeleted = 0
    IF @parentId_E75FF77FA0E041EA889BCD2DB296EC83 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('E75FF77F-A0E0-41EA-889B-CD2DB296EC83', N'1 Serisi E81', 'bmw-1-serisi-e81', @parentId_E75FF77FA0E041EA889BCD2DB296EC83, NULL, NULL, 0, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'bmw-1-serisi-e87' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_5AB0257C56064265B2C19D4111B7AD58 uniqueidentifier
    SELECT @parentId_5AB0257C56064265B2C19D4111B7AD58 = Id FROM Categories WHERE Slug = 'bmw' AND IsDeleted = 0
    IF @parentId_5AB0257C56064265B2C19D4111B7AD58 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('5AB0257C-5606-4265-B2C1-9D4111B7AD58', N'1 Serisi E87', 'bmw-1-serisi-e87', @parentId_5AB0257C56064265B2C19D4111B7AD58, NULL, NULL, 1, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'bmw-1-serisi-f20' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_A1A6F34750884ADE8CBC50E197B5A267 uniqueidentifier
    SELECT @parentId_A1A6F34750884ADE8CBC50E197B5A267 = Id FROM Categories WHERE Slug = 'bmw' AND IsDeleted = 0
    IF @parentId_A1A6F34750884ADE8CBC50E197B5A267 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('A1A6F347-5088-4ADE-8CBC-50E197B5A267', N'1 Serisi F20', 'bmw-1-serisi-f20', @parentId_A1A6F34750884ADE8CBC50E197B5A267, NULL, NULL, 2, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'bmw-1-serisi-f40' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_6A10704CEAA04C8DB4520B1E79C7AB37 uniqueidentifier
    SELECT @parentId_6A10704CEAA04C8DB4520B1E79C7AB37 = Id FROM Categories WHERE Slug = 'bmw' AND IsDeleted = 0
    IF @parentId_6A10704CEAA04C8DB4520B1E79C7AB37 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('6A10704C-EAA0-4C8D-B452-0B1E79C7AB37', N'1 Serisi F40', 'bmw-1-serisi-f40', @parentId_6A10704CEAA04C8DB4520B1E79C7AB37, NULL, NULL, 3, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'bmw-2-serisi-f22' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_D65D751B19BA4CAC9FDDC454788D4BDA uniqueidentifier
    SELECT @parentId_D65D751B19BA4CAC9FDDC454788D4BDA = Id FROM Categories WHERE Slug = 'bmw' AND IsDeleted = 0
    IF @parentId_D65D751B19BA4CAC9FDDC454788D4BDA IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('D65D751B-19BA-4CAC-9FDD-C454788D4BDA', N'2 Serisi F22', 'bmw-2-serisi-f22', @parentId_D65D751B19BA4CAC9FDDC454788D4BDA, NULL, NULL, 4, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'bmw-2-serisi-f45' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_21E4E1A355E744C78C9777990352FD89 uniqueidentifier
    SELECT @parentId_21E4E1A355E744C78C9777990352FD89 = Id FROM Categories WHERE Slug = 'bmw' AND IsDeleted = 0
    IF @parentId_21E4E1A355E744C78C9777990352FD89 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('21E4E1A3-55E7-44C7-8C97-77990352FD89', N'2 Serisi F45', 'bmw-2-serisi-f45', @parentId_21E4E1A355E744C78C9777990352FD89, NULL, NULL, 5, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'bmw-2-serisi-g42' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_B29FC19D41874DDE8924E4D12E081698 uniqueidentifier
    SELECT @parentId_B29FC19D41874DDE8924E4D12E081698 = Id FROM Categories WHERE Slug = 'bmw' AND IsDeleted = 0
    IF @parentId_B29FC19D41874DDE8924E4D12E081698 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('B29FC19D-4187-4DDE-8924-E4D12E081698', N'2 Serisi G42', 'bmw-2-serisi-g42', @parentId_B29FC19D41874DDE8924E4D12E081698, NULL, NULL, 6, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'bmw-3-serisi-e30' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_326F922A4E1547C9AA28E01E973A0EAF uniqueidentifier
    SELECT @parentId_326F922A4E1547C9AA28E01E973A0EAF = Id FROM Categories WHERE Slug = 'bmw' AND IsDeleted = 0
    IF @parentId_326F922A4E1547C9AA28E01E973A0EAF IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('326F922A-4E15-47C9-AA28-E01E973A0EAF', N'3 Serisi E30', 'bmw-3-serisi-e30', @parentId_326F922A4E1547C9AA28E01E973A0EAF, NULL, NULL, 7, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'bmw-3-serisi-e36' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_1C32E89DB80546D3BE833605271602EC uniqueidentifier
    SELECT @parentId_1C32E89DB80546D3BE833605271602EC = Id FROM Categories WHERE Slug = 'bmw' AND IsDeleted = 0
    IF @parentId_1C32E89DB80546D3BE833605271602EC IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('1C32E89D-B805-46D3-BE83-3605271602EC', N'3 Serisi E36', 'bmw-3-serisi-e36', @parentId_1C32E89DB80546D3BE833605271602EC, NULL, NULL, 8, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'bmw-3-serisi-e46' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_B99A5A15F3664A40A7529E1743681A03 uniqueidentifier
    SELECT @parentId_B99A5A15F3664A40A7529E1743681A03 = Id FROM Categories WHERE Slug = 'bmw' AND IsDeleted = 0
    IF @parentId_B99A5A15F3664A40A7529E1743681A03 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('B99A5A15-F366-4A40-A752-9E1743681A03', N'3 Serisi E46', 'bmw-3-serisi-e46', @parentId_B99A5A15F3664A40A7529E1743681A03, NULL, NULL, 9, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'bmw-3-serisi-e90' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_04DDA122ECE54012832841D4DD7C6A52 uniqueidentifier
    SELECT @parentId_04DDA122ECE54012832841D4DD7C6A52 = Id FROM Categories WHERE Slug = 'bmw' AND IsDeleted = 0
    IF @parentId_04DDA122ECE54012832841D4DD7C6A52 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('04DDA122-ECE5-4012-8328-41D4DD7C6A52', N'3 Serisi E90', 'bmw-3-serisi-e90', @parentId_04DDA122ECE54012832841D4DD7C6A52, NULL, NULL, 10, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'bmw-3-serisi-f30' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_DAD70FB051F44E40A1BC3E04E52C2F0C uniqueidentifier
    SELECT @parentId_DAD70FB051F44E40A1BC3E04E52C2F0C = Id FROM Categories WHERE Slug = 'bmw' AND IsDeleted = 0
    IF @parentId_DAD70FB051F44E40A1BC3E04E52C2F0C IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('DAD70FB0-51F4-4E40-A1BC-3E04E52C2F0C', N'3 Serisi F30', 'bmw-3-serisi-f30', @parentId_DAD70FB051F44E40A1BC3E04E52C2F0C, NULL, NULL, 11, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'bmw-3-serisi-g20' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_B1D83C2D4B94421D8A32023765E96519 uniqueidentifier
    SELECT @parentId_B1D83C2D4B94421D8A32023765E96519 = Id FROM Categories WHERE Slug = 'bmw' AND IsDeleted = 0
    IF @parentId_B1D83C2D4B94421D8A32023765E96519 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('B1D83C2D-4B94-421D-8A32-023765E96519', N'3 Serisi G20', 'bmw-3-serisi-g20', @parentId_B1D83C2D4B94421D8A32023765E96519, NULL, NULL, 12, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'bmw-4-serisi-f32' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_F4AE7846E5DA41CEA8BC78DDC902FA74 uniqueidentifier
    SELECT @parentId_F4AE7846E5DA41CEA8BC78DDC902FA74 = Id FROM Categories WHERE Slug = 'bmw' AND IsDeleted = 0
    IF @parentId_F4AE7846E5DA41CEA8BC78DDC902FA74 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('F4AE7846-E5DA-41CE-A8BC-78DDC902FA74', N'4 Serisi F32', 'bmw-4-serisi-f32', @parentId_F4AE7846E5DA41CEA8BC78DDC902FA74, NULL, NULL, 13, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'bmw-4-serisi-g22' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_C9BADDA630564A1D9807316D6831F8F3 uniqueidentifier
    SELECT @parentId_C9BADDA630564A1D9807316D6831F8F3 = Id FROM Categories WHERE Slug = 'bmw' AND IsDeleted = 0
    IF @parentId_C9BADDA630564A1D9807316D6831F8F3 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('C9BADDA6-3056-4A1D-9807-316D6831F8F3', N'4 Serisi G22', 'bmw-4-serisi-g22', @parentId_C9BADDA630564A1D9807316D6831F8F3, NULL, NULL, 14, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'bmw-5-serisi-e34' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_6FF03F70F4954BF680943A9F18F5D09E uniqueidentifier
    SELECT @parentId_6FF03F70F4954BF680943A9F18F5D09E = Id FROM Categories WHERE Slug = 'bmw' AND IsDeleted = 0
    IF @parentId_6FF03F70F4954BF680943A9F18F5D09E IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('6FF03F70-F495-4BF6-8094-3A9F18F5D09E', N'5 Serisi E34', 'bmw-5-serisi-e34', @parentId_6FF03F70F4954BF680943A9F18F5D09E, NULL, NULL, 15, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'bmw-5-serisi-e39' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_371FEC5DC1B0404A989A64385885A7E9 uniqueidentifier
    SELECT @parentId_371FEC5DC1B0404A989A64385885A7E9 = Id FROM Categories WHERE Slug = 'bmw' AND IsDeleted = 0
    IF @parentId_371FEC5DC1B0404A989A64385885A7E9 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('371FEC5D-C1B0-404A-989A-64385885A7E9', N'5 Serisi E39', 'bmw-5-serisi-e39', @parentId_371FEC5DC1B0404A989A64385885A7E9, NULL, NULL, 16, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'bmw-5-serisi-e60' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_68E3BEF0954B4CF1857C6857B1AB62AA uniqueidentifier
    SELECT @parentId_68E3BEF0954B4CF1857C6857B1AB62AA = Id FROM Categories WHERE Slug = 'bmw' AND IsDeleted = 0
    IF @parentId_68E3BEF0954B4CF1857C6857B1AB62AA IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('68E3BEF0-954B-4CF1-857C-6857B1AB62AA', N'5 Serisi E60', 'bmw-5-serisi-e60', @parentId_68E3BEF0954B4CF1857C6857B1AB62AA, NULL, NULL, 17, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'bmw-5-serisi-f10' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_B0E66586AEE74611A798A051E41E2E2E uniqueidentifier
    SELECT @parentId_B0E66586AEE74611A798A051E41E2E2E = Id FROM Categories WHERE Slug = 'bmw' AND IsDeleted = 0
    IF @parentId_B0E66586AEE74611A798A051E41E2E2E IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('B0E66586-AEE7-4611-A798-A051E41E2E2E', N'5 Serisi F10', 'bmw-5-serisi-f10', @parentId_B0E66586AEE74611A798A051E41E2E2E, NULL, NULL, 18, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'bmw-5-serisi-g30' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_EBB27116F08C41699A1D3D514396054F uniqueidentifier
    SELECT @parentId_EBB27116F08C41699A1D3D514396054F = Id FROM Categories WHERE Slug = 'bmw' AND IsDeleted = 0
    IF @parentId_EBB27116F08C41699A1D3D514396054F IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('EBB27116-F08C-4169-9A1D-3D514396054F', N'5 Serisi G30', 'bmw-5-serisi-g30', @parentId_EBB27116F08C41699A1D3D514396054F, NULL, NULL, 19, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'bmw-6-serisi-e63' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_3EB0F612E9A646E38BE2EF9884F01710 uniqueidentifier
    SELECT @parentId_3EB0F612E9A646E38BE2EF9884F01710 = Id FROM Categories WHERE Slug = 'bmw' AND IsDeleted = 0
    IF @parentId_3EB0F612E9A646E38BE2EF9884F01710 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('3EB0F612-E9A6-46E3-8BE2-EF9884F01710', N'6 Serisi E63', 'bmw-6-serisi-e63', @parentId_3EB0F612E9A646E38BE2EF9884F01710, NULL, NULL, 20, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'bmw-6-serisi-f12' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_5877B90A1D4742DF8C67D1AF9920087A uniqueidentifier
    SELECT @parentId_5877B90A1D4742DF8C67D1AF9920087A = Id FROM Categories WHERE Slug = 'bmw' AND IsDeleted = 0
    IF @parentId_5877B90A1D4742DF8C67D1AF9920087A IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('5877B90A-1D47-42DF-8C67-D1AF9920087A', N'6 Serisi F12', 'bmw-6-serisi-f12', @parentId_5877B90A1D4742DF8C67D1AF9920087A, NULL, NULL, 21, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'bmw-7-serisi-e38' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_1BD73C7228614DD1B86EDE1214333D9C uniqueidentifier
    SELECT @parentId_1BD73C7228614DD1B86EDE1214333D9C = Id FROM Categories WHERE Slug = 'bmw' AND IsDeleted = 0
    IF @parentId_1BD73C7228614DD1B86EDE1214333D9C IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('1BD73C72-2861-4DD1-B86E-DE1214333D9C', N'7 Serisi E38', 'bmw-7-serisi-e38', @parentId_1BD73C7228614DD1B86EDE1214333D9C, NULL, NULL, 22, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'bmw-7-serisi-e65' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_D89881E8A387499EA21AE6AFDF399F49 uniqueidentifier
    SELECT @parentId_D89881E8A387499EA21AE6AFDF399F49 = Id FROM Categories WHERE Slug = 'bmw' AND IsDeleted = 0
    IF @parentId_D89881E8A387499EA21AE6AFDF399F49 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('D89881E8-A387-499E-A21A-E6AFDF399F49', N'7 Serisi E65', 'bmw-7-serisi-e65', @parentId_D89881E8A387499EA21AE6AFDF399F49, NULL, NULL, 23, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'bmw-7-serisi-f01' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_8947BBDA6FAA44CE8F85D4FEEE587023 uniqueidentifier
    SELECT @parentId_8947BBDA6FAA44CE8F85D4FEEE587023 = Id FROM Categories WHERE Slug = 'bmw' AND IsDeleted = 0
    IF @parentId_8947BBDA6FAA44CE8F85D4FEEE587023 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('8947BBDA-6FAA-44CE-8F85-D4FEEE587023', N'7 Serisi F01', 'bmw-7-serisi-f01', @parentId_8947BBDA6FAA44CE8F85D4FEEE587023, NULL, NULL, 24, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'bmw-7-serisi-g11' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_8F45742EA0B244EFB4AF3BC22E473B16 uniqueidentifier
    SELECT @parentId_8F45742EA0B244EFB4AF3BC22E473B16 = Id FROM Categories WHERE Slug = 'bmw' AND IsDeleted = 0
    IF @parentId_8F45742EA0B244EFB4AF3BC22E473B16 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('8F45742E-A0B2-44EF-B4AF-3BC22E473B16', N'7 Serisi G11', 'bmw-7-serisi-g11', @parentId_8F45742EA0B244EFB4AF3BC22E473B16, NULL, NULL, 25, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'bmw-x1-e84' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_E734B939DA4A4836B8C91826A931CE1A uniqueidentifier
    SELECT @parentId_E734B939DA4A4836B8C91826A931CE1A = Id FROM Categories WHERE Slug = 'bmw' AND IsDeleted = 0
    IF @parentId_E734B939DA4A4836B8C91826A931CE1A IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('E734B939-DA4A-4836-B8C9-1826A931CE1A', N'X1 E84', 'bmw-x1-e84', @parentId_E734B939DA4A4836B8C91826A931CE1A, NULL, NULL, 26, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'bmw-x1-f48' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_D3C06759F3584E9ABBE44ECEC62B0EE3 uniqueidentifier
    SELECT @parentId_D3C06759F3584E9ABBE44ECEC62B0EE3 = Id FROM Categories WHERE Slug = 'bmw' AND IsDeleted = 0
    IF @parentId_D3C06759F3584E9ABBE44ECEC62B0EE3 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('D3C06759-F358-4E9A-BBE4-4ECEC62B0EE3', N'X1 F48', 'bmw-x1-f48', @parentId_D3C06759F3584E9ABBE44ECEC62B0EE3, NULL, NULL, 27, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'bmw-x1-u11' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_3E28BE2F1B4948E8883758F712BBAAC4 uniqueidentifier
    SELECT @parentId_3E28BE2F1B4948E8883758F712BBAAC4 = Id FROM Categories WHERE Slug = 'bmw' AND IsDeleted = 0
    IF @parentId_3E28BE2F1B4948E8883758F712BBAAC4 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('3E28BE2F-1B49-48E8-8837-58F712BBAAC4', N'X1 U11', 'bmw-x1-u11', @parentId_3E28BE2F1B4948E8883758F712BBAAC4, NULL, NULL, 28, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'bmw-x3-e83' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_282B488A1F5144EBB1A460E0609438D3 uniqueidentifier
    SELECT @parentId_282B488A1F5144EBB1A460E0609438D3 = Id FROM Categories WHERE Slug = 'bmw' AND IsDeleted = 0
    IF @parentId_282B488A1F5144EBB1A460E0609438D3 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('282B488A-1F51-44EB-B1A4-60E0609438D3', N'X3 E83', 'bmw-x3-e83', @parentId_282B488A1F5144EBB1A460E0609438D3, NULL, NULL, 29, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'bmw-x3-f25' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_EC2322CB74FB487EB8FF4FF9C1036DA1 uniqueidentifier
    SELECT @parentId_EC2322CB74FB487EB8FF4FF9C1036DA1 = Id FROM Categories WHERE Slug = 'bmw' AND IsDeleted = 0
    IF @parentId_EC2322CB74FB487EB8FF4FF9C1036DA1 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('EC2322CB-74FB-487E-B8FF-4FF9C1036DA1', N'X3 F25', 'bmw-x3-f25', @parentId_EC2322CB74FB487EB8FF4FF9C1036DA1, NULL, NULL, 30, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'bmw-x3-g01' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_6386F6F6E31A4840B098035A6CA19088 uniqueidentifier
    SELECT @parentId_6386F6F6E31A4840B098035A6CA19088 = Id FROM Categories WHERE Slug = 'bmw' AND IsDeleted = 0
    IF @parentId_6386F6F6E31A4840B098035A6CA19088 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('6386F6F6-E31A-4840-B098-035A6CA19088', N'X3 G01', 'bmw-x3-g01', @parentId_6386F6F6E31A4840B098035A6CA19088, NULL, NULL, 31, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'bmw-x5-e53' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_81E4F0E31F554299B8A0358D191A6A7C uniqueidentifier
    SELECT @parentId_81E4F0E31F554299B8A0358D191A6A7C = Id FROM Categories WHERE Slug = 'bmw' AND IsDeleted = 0
    IF @parentId_81E4F0E31F554299B8A0358D191A6A7C IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('81E4F0E3-1F55-4299-B8A0-358D191A6A7C', N'X5 E53', 'bmw-x5-e53', @parentId_81E4F0E31F554299B8A0358D191A6A7C, NULL, NULL, 32, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'bmw-x5-e70' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_3905CB98E67644BC9434CDF17F50675C uniqueidentifier
    SELECT @parentId_3905CB98E67644BC9434CDF17F50675C = Id FROM Categories WHERE Slug = 'bmw' AND IsDeleted = 0
    IF @parentId_3905CB98E67644BC9434CDF17F50675C IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('3905CB98-E676-44BC-9434-CDF17F50675C', N'X5 E70', 'bmw-x5-e70', @parentId_3905CB98E67644BC9434CDF17F50675C, NULL, NULL, 33, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'bmw-x5-f15' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_D6072F9C4A174604B30340034149E270 uniqueidentifier
    SELECT @parentId_D6072F9C4A174604B30340034149E270 = Id FROM Categories WHERE Slug = 'bmw' AND IsDeleted = 0
    IF @parentId_D6072F9C4A174604B30340034149E270 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('D6072F9C-4A17-4604-B303-40034149E270', N'X5 F15', 'bmw-x5-f15', @parentId_D6072F9C4A174604B30340034149E270, NULL, NULL, 34, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'bmw-x5-g05' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_60BD617C738A4200AE54CE0BC3755BA2 uniqueidentifier
    SELECT @parentId_60BD617C738A4200AE54CE0BC3755BA2 = Id FROM Categories WHERE Slug = 'bmw' AND IsDeleted = 0
    IF @parentId_60BD617C738A4200AE54CE0BC3755BA2 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('60BD617C-738A-4200-AE54-CE0BC3755BA2', N'X5 G05', 'bmw-x5-g05', @parentId_60BD617C738A4200AE54CE0BC3755BA2, NULL, NULL, 35, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'bmw-x6-e71' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_EAC21CD6F8CE45C98BE93F1A51E52855 uniqueidentifier
    SELECT @parentId_EAC21CD6F8CE45C98BE93F1A51E52855 = Id FROM Categories WHERE Slug = 'bmw' AND IsDeleted = 0
    IF @parentId_EAC21CD6F8CE45C98BE93F1A51E52855 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('EAC21CD6-F8CE-45C9-8BE9-3F1A51E52855', N'X6 E71', 'bmw-x6-e71', @parentId_EAC21CD6F8CE45C98BE93F1A51E52855, NULL, NULL, 36, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'bmw-x6-f16' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_7019B0E4CB5944EDB3E79AE2EC0D20B9 uniqueidentifier
    SELECT @parentId_7019B0E4CB5944EDB3E79AE2EC0D20B9 = Id FROM Categories WHERE Slug = 'bmw' AND IsDeleted = 0
    IF @parentId_7019B0E4CB5944EDB3E79AE2EC0D20B9 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('7019B0E4-CB59-44ED-B3E7-9AE2EC0D20B9', N'X6 F16', 'bmw-x6-f16', @parentId_7019B0E4CB5944EDB3E79AE2EC0D20B9, NULL, NULL, 37, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'bmw-m3-e36' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_FD51A86311DF4638816C9FFFD7FD91E1 uniqueidentifier
    SELECT @parentId_FD51A86311DF4638816C9FFFD7FD91E1 = Id FROM Categories WHERE Slug = 'bmw' AND IsDeleted = 0
    IF @parentId_FD51A86311DF4638816C9FFFD7FD91E1 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('FD51A863-11DF-4638-816C-9FFFD7FD91E1', N'M3 E36', 'bmw-m3-e36', @parentId_FD51A86311DF4638816C9FFFD7FD91E1, NULL, NULL, 38, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'bmw-m3-e46' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_CC4900223492408984215F08E74042F5 uniqueidentifier
    SELECT @parentId_CC4900223492408984215F08E74042F5 = Id FROM Categories WHERE Slug = 'bmw' AND IsDeleted = 0
    IF @parentId_CC4900223492408984215F08E74042F5 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('CC490022-3492-4089-8421-5F08E74042F5', N'M3 E46', 'bmw-m3-e46', @parentId_CC4900223492408984215F08E74042F5, NULL, NULL, 39, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'bmw-m3-e90' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_BC613FD25E3A464FA2FBB362C6B83844 uniqueidentifier
    SELECT @parentId_BC613FD25E3A464FA2FBB362C6B83844 = Id FROM Categories WHERE Slug = 'bmw' AND IsDeleted = 0
    IF @parentId_BC613FD25E3A464FA2FBB362C6B83844 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('BC613FD2-5E3A-464F-A2FB-B362C6B83844', N'M3 E90', 'bmw-m3-e90', @parentId_BC613FD25E3A464FA2FBB362C6B83844, NULL, NULL, 40, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'bmw-m3-f80' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_AF0DAD80FF6241BF9248A26659188560 uniqueidentifier
    SELECT @parentId_AF0DAD80FF6241BF9248A26659188560 = Id FROM Categories WHERE Slug = 'bmw' AND IsDeleted = 0
    IF @parentId_AF0DAD80FF6241BF9248A26659188560 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('AF0DAD80-FF62-41BF-9248-A26659188560', N'M3 F80', 'bmw-m3-f80', @parentId_AF0DAD80FF6241BF9248A26659188560, NULL, NULL, 41, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'bmw-m5-e39' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_F03C3C3CA56C40789A4DC7368C7B10F9 uniqueidentifier
    SELECT @parentId_F03C3C3CA56C40789A4DC7368C7B10F9 = Id FROM Categories WHERE Slug = 'bmw' AND IsDeleted = 0
    IF @parentId_F03C3C3CA56C40789A4DC7368C7B10F9 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('F03C3C3C-A56C-4078-9A4D-C7368C7B10F9', N'M5 E39', 'bmw-m5-e39', @parentId_F03C3C3CA56C40789A4DC7368C7B10F9, NULL, NULL, 42, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'bmw-m5-e60' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_54574F6F98724F84B91C3472FA7B5397 uniqueidentifier
    SELECT @parentId_54574F6F98724F84B91C3472FA7B5397 = Id FROM Categories WHERE Slug = 'bmw' AND IsDeleted = 0
    IF @parentId_54574F6F98724F84B91C3472FA7B5397 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('54574F6F-9872-4F84-B91C-3472FA7B5397', N'M5 E60', 'bmw-m5-e60', @parentId_54574F6F98724F84B91C3472FA7B5397, NULL, NULL, 43, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'bmw-m5-f10' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_AF015787D75D4DA8B20A01FB2C7EC845 uniqueidentifier
    SELECT @parentId_AF015787D75D4DA8B20A01FB2C7EC845 = Id FROM Categories WHERE Slug = 'bmw' AND IsDeleted = 0
    IF @parentId_AF015787D75D4DA8B20A01FB2C7EC845 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('AF015787-D75D-4DA8-B20A-01FB2C7EC845', N'M5 F10', 'bmw-m5-f10', @parentId_AF015787D75D4DA8B20A01FB2C7EC845, NULL, NULL, 44, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'bmw-z4-e85' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_6B0C5EF5AACA4B0A9485CA5DC02D7130 uniqueidentifier
    SELECT @parentId_6B0C5EF5AACA4B0A9485CA5DC02D7130 = Id FROM Categories WHERE Slug = 'bmw' AND IsDeleted = 0
    IF @parentId_6B0C5EF5AACA4B0A9485CA5DC02D7130 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('6B0C5EF5-AACA-4B0A-9485-CA5DC02D7130', N'Z4 E85', 'bmw-z4-e85', @parentId_6B0C5EF5AACA4B0A9485CA5DC02D7130, NULL, NULL, 45, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'bmw-z4-e89' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_F91951A40EA8494EB4CD27EB3C706020 uniqueidentifier
    SELECT @parentId_F91951A40EA8494EB4CD27EB3C706020 = Id FROM Categories WHERE Slug = 'bmw' AND IsDeleted = 0
    IF @parentId_F91951A40EA8494EB4CD27EB3C706020 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('F91951A4-0EA8-494E-B4CD-27EB3C706020', N'Z4 E89', 'bmw-z4-e89', @parentId_F91951A40EA8494EB4CD27EB3C706020, NULL, NULL, 46, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mercedes-benz' AND IsDeleted = 0)
BEGIN
    INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
    VALUES ('E0B5B544-0CB3-49CE-8F17-BBAA7B3125E4', N'Mercedes-Benz', 'mercedes-benz', NULL, NULL, NULL, 3, 1, 1, 1, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
ELSE
BEGIN
    -- Varsa ShowInVehicleNav=true gÃ¼ncelle
    UPDATE Categories SET ShowInVehicleNav = 1 WHERE Slug = 'mercedes-benz' AND IsDeleted = 0
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mercedes-benz-a-serisi-w168' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_AB14DA0996934B1DA34FC2F856182887 uniqueidentifier
    SELECT @parentId_AB14DA0996934B1DA34FC2F856182887 = Id FROM Categories WHERE Slug = 'mercedes-benz' AND IsDeleted = 0
    IF @parentId_AB14DA0996934B1DA34FC2F856182887 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('AB14DA09-9693-4B1D-A34F-C2F856182887', N'A Serisi W168', 'mercedes-benz-a-serisi-w168', @parentId_AB14DA0996934B1DA34FC2F856182887, NULL, NULL, 0, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mercedes-benz-a-serisi-w169' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_C20F149C87C74373BAA9C1F0EFD7830C uniqueidentifier
    SELECT @parentId_C20F149C87C74373BAA9C1F0EFD7830C = Id FROM Categories WHERE Slug = 'mercedes-benz' AND IsDeleted = 0
    IF @parentId_C20F149C87C74373BAA9C1F0EFD7830C IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('C20F149C-87C7-4373-BAA9-C1F0EFD7830C', N'A Serisi W169', 'mercedes-benz-a-serisi-w169', @parentId_C20F149C87C74373BAA9C1F0EFD7830C, NULL, NULL, 1, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mercedes-benz-a-serisi-w176' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_1FA2B49E34A34253A04BD39D45FCF63C uniqueidentifier
    SELECT @parentId_1FA2B49E34A34253A04BD39D45FCF63C = Id FROM Categories WHERE Slug = 'mercedes-benz' AND IsDeleted = 0
    IF @parentId_1FA2B49E34A34253A04BD39D45FCF63C IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('1FA2B49E-34A3-4253-A04B-D39D45FCF63C', N'A Serisi W176', 'mercedes-benz-a-serisi-w176', @parentId_1FA2B49E34A34253A04BD39D45FCF63C, NULL, NULL, 2, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mercedes-benz-a-serisi-w177' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_54C9C2F0B3A64EFD8A4F7D413B116E13 uniqueidentifier
    SELECT @parentId_54C9C2F0B3A64EFD8A4F7D413B116E13 = Id FROM Categories WHERE Slug = 'mercedes-benz' AND IsDeleted = 0
    IF @parentId_54C9C2F0B3A64EFD8A4F7D413B116E13 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('54C9C2F0-B3A6-4EFD-8A4F-7D413B116E13', N'A Serisi W177', 'mercedes-benz-a-serisi-w177', @parentId_54C9C2F0B3A64EFD8A4F7D413B116E13, NULL, NULL, 3, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mercedes-benz-b-serisi-w245' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_09958C31EE294F7586112F4FB534A6B3 uniqueidentifier
    SELECT @parentId_09958C31EE294F7586112F4FB534A6B3 = Id FROM Categories WHERE Slug = 'mercedes-benz' AND IsDeleted = 0
    IF @parentId_09958C31EE294F7586112F4FB534A6B3 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('09958C31-EE29-4F75-8611-2F4FB534A6B3', N'B Serisi W245', 'mercedes-benz-b-serisi-w245', @parentId_09958C31EE294F7586112F4FB534A6B3, NULL, NULL, 4, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mercedes-benz-b-serisi-w246' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_10A2394E09B24C91BC586E5EEAB6214E uniqueidentifier
    SELECT @parentId_10A2394E09B24C91BC586E5EEAB6214E = Id FROM Categories WHERE Slug = 'mercedes-benz' AND IsDeleted = 0
    IF @parentId_10A2394E09B24C91BC586E5EEAB6214E IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('10A2394E-09B2-4C91-BC58-6E5EEAB6214E', N'B Serisi W246', 'mercedes-benz-b-serisi-w246', @parentId_10A2394E09B24C91BC586E5EEAB6214E, NULL, NULL, 5, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mercedes-benz-b-serisi-w247' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_4A3C4A23A4C941DD89CE743D08E7615B uniqueidentifier
    SELECT @parentId_4A3C4A23A4C941DD89CE743D08E7615B = Id FROM Categories WHERE Slug = 'mercedes-benz' AND IsDeleted = 0
    IF @parentId_4A3C4A23A4C941DD89CE743D08E7615B IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('4A3C4A23-A4C9-41DD-89CE-743D08E7615B', N'B Serisi W247', 'mercedes-benz-b-serisi-w247', @parentId_4A3C4A23A4C941DD89CE743D08E7615B, NULL, NULL, 6, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mercedes-benz-c-serisi-w202' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_0168AF4153AD4956AB9934579579A011 uniqueidentifier
    SELECT @parentId_0168AF4153AD4956AB9934579579A011 = Id FROM Categories WHERE Slug = 'mercedes-benz' AND IsDeleted = 0
    IF @parentId_0168AF4153AD4956AB9934579579A011 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('0168AF41-53AD-4956-AB99-34579579A011', N'C Serisi W202', 'mercedes-benz-c-serisi-w202', @parentId_0168AF4153AD4956AB9934579579A011, NULL, NULL, 7, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mercedes-benz-c-serisi-w203' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_450CBD370D2B4BC2A80DB844B8B04DA4 uniqueidentifier
    SELECT @parentId_450CBD370D2B4BC2A80DB844B8B04DA4 = Id FROM Categories WHERE Slug = 'mercedes-benz' AND IsDeleted = 0
    IF @parentId_450CBD370D2B4BC2A80DB844B8B04DA4 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('450CBD37-0D2B-4BC2-A80D-B844B8B04DA4', N'C Serisi W203', 'mercedes-benz-c-serisi-w203', @parentId_450CBD370D2B4BC2A80DB844B8B04DA4, NULL, NULL, 8, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mercedes-benz-c-serisi-w204' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_47DAC2B0EECC4B5CAD5BD2198CFEF45A uniqueidentifier
    SELECT @parentId_47DAC2B0EECC4B5CAD5BD2198CFEF45A = Id FROM Categories WHERE Slug = 'mercedes-benz' AND IsDeleted = 0
    IF @parentId_47DAC2B0EECC4B5CAD5BD2198CFEF45A IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('47DAC2B0-EECC-4B5C-AD5B-D2198CFEF45A', N'C Serisi W204', 'mercedes-benz-c-serisi-w204', @parentId_47DAC2B0EECC4B5CAD5BD2198CFEF45A, NULL, NULL, 9, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mercedes-benz-c-serisi-w205' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_666392D78ED74D1DBBD9C9FBCF38BB8D uniqueidentifier
    SELECT @parentId_666392D78ED74D1DBBD9C9FBCF38BB8D = Id FROM Categories WHERE Slug = 'mercedes-benz' AND IsDeleted = 0
    IF @parentId_666392D78ED74D1DBBD9C9FBCF38BB8D IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('666392D7-8ED7-4D1D-BBD9-C9FBCF38BB8D', N'C Serisi W205', 'mercedes-benz-c-serisi-w205', @parentId_666392D78ED74D1DBBD9C9FBCF38BB8D, NULL, NULL, 10, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mercedes-benz-c-serisi-w206' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_2332890E018243578DDBC98B2F8889FE uniqueidentifier
    SELECT @parentId_2332890E018243578DDBC98B2F8889FE = Id FROM Categories WHERE Slug = 'mercedes-benz' AND IsDeleted = 0
    IF @parentId_2332890E018243578DDBC98B2F8889FE IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('2332890E-0182-4357-8DDB-C98B2F8889FE', N'C Serisi W206', 'mercedes-benz-c-serisi-w206', @parentId_2332890E018243578DDBC98B2F8889FE, NULL, NULL, 11, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mercedes-benz-e-serisi-w210' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_3A0AFD1259CA46388341AE6158429FD7 uniqueidentifier
    SELECT @parentId_3A0AFD1259CA46388341AE6158429FD7 = Id FROM Categories WHERE Slug = 'mercedes-benz' AND IsDeleted = 0
    IF @parentId_3A0AFD1259CA46388341AE6158429FD7 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('3A0AFD12-59CA-4638-8341-AE6158429FD7', N'E Serisi W210', 'mercedes-benz-e-serisi-w210', @parentId_3A0AFD1259CA46388341AE6158429FD7, NULL, NULL, 12, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mercedes-benz-e-serisi-w211' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_100C1C0A921248ED88DBF085BE0C0E8D uniqueidentifier
    SELECT @parentId_100C1C0A921248ED88DBF085BE0C0E8D = Id FROM Categories WHERE Slug = 'mercedes-benz' AND IsDeleted = 0
    IF @parentId_100C1C0A921248ED88DBF085BE0C0E8D IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('100C1C0A-9212-48ED-88DB-F085BE0C0E8D', N'E Serisi W211', 'mercedes-benz-e-serisi-w211', @parentId_100C1C0A921248ED88DBF085BE0C0E8D, NULL, NULL, 13, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mercedes-benz-e-serisi-w212' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_754039A75A214617AD6966C67D636123 uniqueidentifier
    SELECT @parentId_754039A75A214617AD6966C67D636123 = Id FROM Categories WHERE Slug = 'mercedes-benz' AND IsDeleted = 0
    IF @parentId_754039A75A214617AD6966C67D636123 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('754039A7-5A21-4617-AD69-66C67D636123', N'E Serisi W212', 'mercedes-benz-e-serisi-w212', @parentId_754039A75A214617AD6966C67D636123, NULL, NULL, 14, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mercedes-benz-e-serisi-w213' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_DACA9F9C67D94264A9B96137BA6CBC76 uniqueidentifier
    SELECT @parentId_DACA9F9C67D94264A9B96137BA6CBC76 = Id FROM Categories WHERE Slug = 'mercedes-benz' AND IsDeleted = 0
    IF @parentId_DACA9F9C67D94264A9B96137BA6CBC76 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('DACA9F9C-67D9-4264-A9B9-6137BA6CBC76', N'E Serisi W213', 'mercedes-benz-e-serisi-w213', @parentId_DACA9F9C67D94264A9B96137BA6CBC76, NULL, NULL, 15, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mercedes-benz-s-serisi-w220' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_DA150E1DABE340D2BB8E75D93D25DB07 uniqueidentifier
    SELECT @parentId_DA150E1DABE340D2BB8E75D93D25DB07 = Id FROM Categories WHERE Slug = 'mercedes-benz' AND IsDeleted = 0
    IF @parentId_DA150E1DABE340D2BB8E75D93D25DB07 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('DA150E1D-ABE3-40D2-BB8E-75D93D25DB07', N'S Serisi W220', 'mercedes-benz-s-serisi-w220', @parentId_DA150E1DABE340D2BB8E75D93D25DB07, NULL, NULL, 16, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mercedes-benz-s-serisi-w221' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_609B661466AA47079A4D5ABED4B67BD8 uniqueidentifier
    SELECT @parentId_609B661466AA47079A4D5ABED4B67BD8 = Id FROM Categories WHERE Slug = 'mercedes-benz' AND IsDeleted = 0
    IF @parentId_609B661466AA47079A4D5ABED4B67BD8 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('609B6614-66AA-4707-9A4D-5ABED4B67BD8', N'S Serisi W221', 'mercedes-benz-s-serisi-w221', @parentId_609B661466AA47079A4D5ABED4B67BD8, NULL, NULL, 17, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mercedes-benz-s-serisi-w222' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_6F604BAED3D14E4ABA8EFD88FDF99F3E uniqueidentifier
    SELECT @parentId_6F604BAED3D14E4ABA8EFD88FDF99F3E = Id FROM Categories WHERE Slug = 'mercedes-benz' AND IsDeleted = 0
    IF @parentId_6F604BAED3D14E4ABA8EFD88FDF99F3E IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('6F604BAE-D3D1-4E4A-BA8E-FD88FDF99F3E', N'S Serisi W222', 'mercedes-benz-s-serisi-w222', @parentId_6F604BAED3D14E4ABA8EFD88FDF99F3E, NULL, NULL, 18, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mercedes-benz-gla-x156' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_D87EE27BEB8448819C8F6F1C79DBE683 uniqueidentifier
    SELECT @parentId_D87EE27BEB8448819C8F6F1C79DBE683 = Id FROM Categories WHERE Slug = 'mercedes-benz' AND IsDeleted = 0
    IF @parentId_D87EE27BEB8448819C8F6F1C79DBE683 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('D87EE27B-EB84-4881-9C8F-6F1C79DBE683', N'GLA X156', 'mercedes-benz-gla-x156', @parentId_D87EE27BEB8448819C8F6F1C79DBE683, NULL, NULL, 19, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mercedes-benz-gla-x247' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_8F00E8FB7D2644199052660A68067E33 uniqueidentifier
    SELECT @parentId_8F00E8FB7D2644199052660A68067E33 = Id FROM Categories WHERE Slug = 'mercedes-benz' AND IsDeleted = 0
    IF @parentId_8F00E8FB7D2644199052660A68067E33 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('8F00E8FB-7D26-4419-9052-660A68067E33', N'GLA X247', 'mercedes-benz-gla-x247', @parentId_8F00E8FB7D2644199052660A68067E33, NULL, NULL, 20, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mercedes-benz-glc-x253' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_12C241947CE840F7A723DC383FF1C2A6 uniqueidentifier
    SELECT @parentId_12C241947CE840F7A723DC383FF1C2A6 = Id FROM Categories WHERE Slug = 'mercedes-benz' AND IsDeleted = 0
    IF @parentId_12C241947CE840F7A723DC383FF1C2A6 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('12C24194-7CE8-40F7-A723-DC383FF1C2A6', N'GLC X253', 'mercedes-benz-glc-x253', @parentId_12C241947CE840F7A723DC383FF1C2A6, NULL, NULL, 21, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mercedes-benz-gle-w166' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_033CDB775F05467D8EB6D74EDDF2838A uniqueidentifier
    SELECT @parentId_033CDB775F05467D8EB6D74EDDF2838A = Id FROM Categories WHERE Slug = 'mercedes-benz' AND IsDeleted = 0
    IF @parentId_033CDB775F05467D8EB6D74EDDF2838A IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('033CDB77-5F05-467D-8EB6-D74EDDF2838A', N'GLE W166', 'mercedes-benz-gle-w166', @parentId_033CDB775F05467D8EB6D74EDDF2838A, NULL, NULL, 22, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mercedes-benz-gle-w167' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_682CBE11E9B644A5A0F71B1D47D88117 uniqueidentifier
    SELECT @parentId_682CBE11E9B644A5A0F71B1D47D88117 = Id FROM Categories WHERE Slug = 'mercedes-benz' AND IsDeleted = 0
    IF @parentId_682CBE11E9B644A5A0F71B1D47D88117 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('682CBE11-E9B6-44A5-A0F7-1B1D47D88117', N'GLE W167', 'mercedes-benz-gle-w167', @parentId_682CBE11E9B644A5A0F71B1D47D88117, NULL, NULL, 23, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mercedes-benz-gls-x166' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_A1B03C39A4954B8D8CF098CCE1DFFBBF uniqueidentifier
    SELECT @parentId_A1B03C39A4954B8D8CF098CCE1DFFBBF = Id FROM Categories WHERE Slug = 'mercedes-benz' AND IsDeleted = 0
    IF @parentId_A1B03C39A4954B8D8CF098CCE1DFFBBF IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('A1B03C39-A495-4B8D-8CF0-98CCE1DFFBBF', N'GLS X166', 'mercedes-benz-gls-x166', @parentId_A1B03C39A4954B8D8CF098CCE1DFFBBF, NULL, NULL, 24, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mercedes-benz-cla-c117' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_371ADB71CADA4F2281754659E9864D3A uniqueidentifier
    SELECT @parentId_371ADB71CADA4F2281754659E9864D3A = Id FROM Categories WHERE Slug = 'mercedes-benz' AND IsDeleted = 0
    IF @parentId_371ADB71CADA4F2281754659E9864D3A IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('371ADB71-CADA-4F22-8175-4659E9864D3A', N'CLA C117', 'mercedes-benz-cla-c117', @parentId_371ADB71CADA4F2281754659E9864D3A, NULL, NULL, 25, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mercedes-benz-cla-c118' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_8569DD9214F64133944D68C082757B31 uniqueidentifier
    SELECT @parentId_8569DD9214F64133944D68C082757B31 = Id FROM Categories WHERE Slug = 'mercedes-benz' AND IsDeleted = 0
    IF @parentId_8569DD9214F64133944D68C082757B31 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('8569DD92-14F6-4133-944D-68C082757B31', N'CLA C118', 'mercedes-benz-cla-c118', @parentId_8569DD9214F64133944D68C082757B31, NULL, NULL, 26, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mercedes-benz-cls-c218' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_DBF3681E9FA148D1A6EB96B7B59202C1 uniqueidentifier
    SELECT @parentId_DBF3681E9FA148D1A6EB96B7B59202C1 = Id FROM Categories WHERE Slug = 'mercedes-benz' AND IsDeleted = 0
    IF @parentId_DBF3681E9FA148D1A6EB96B7B59202C1 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('DBF3681E-9FA1-48D1-A6EB-96B7B59202C1', N'CLS C218', 'mercedes-benz-cls-c218', @parentId_DBF3681E9FA148D1A6EB96B7B59202C1, NULL, NULL, 27, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mercedes-benz-cls-c257' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_7C7655ABF5864B9D9063843B9CDD5D04 uniqueidentifier
    SELECT @parentId_7C7655ABF5864B9D9063843B9CDD5D04 = Id FROM Categories WHERE Slug = 'mercedes-benz' AND IsDeleted = 0
    IF @parentId_7C7655ABF5864B9D9063843B9CDD5D04 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('7C7655AB-F586-4B9D-9063-843B9CDD5D04', N'CLS C257', 'mercedes-benz-cls-c257', @parentId_7C7655ABF5864B9D9063843B9CDD5D04, NULL, NULL, 28, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mercedes-benz-sprinter-w901' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_7D876A0427434A93A62F63981D55C96F uniqueidentifier
    SELECT @parentId_7D876A0427434A93A62F63981D55C96F = Id FROM Categories WHERE Slug = 'mercedes-benz' AND IsDeleted = 0
    IF @parentId_7D876A0427434A93A62F63981D55C96F IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('7D876A04-2743-4A93-A62F-63981D55C96F', N'Sprinter W901', 'mercedes-benz-sprinter-w901', @parentId_7D876A0427434A93A62F63981D55C96F, NULL, NULL, 29, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mercedes-benz-sprinter-w906' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_BBC01EF5DCCB4531B6B2F13C18D9B876 uniqueidentifier
    SELECT @parentId_BBC01EF5DCCB4531B6B2F13C18D9B876 = Id FROM Categories WHERE Slug = 'mercedes-benz' AND IsDeleted = 0
    IF @parentId_BBC01EF5DCCB4531B6B2F13C18D9B876 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('BBC01EF5-DCCB-4531-B6B2-F13C18D9B876', N'Sprinter W906', 'mercedes-benz-sprinter-w906', @parentId_BBC01EF5DCCB4531B6B2F13C18D9B876, NULL, NULL, 30, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mercedes-benz-sprinter-w907' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_518227F3527640F38F7A72407093F16A uniqueidentifier
    SELECT @parentId_518227F3527640F38F7A72407093F16A = Id FROM Categories WHERE Slug = 'mercedes-benz' AND IsDeleted = 0
    IF @parentId_518227F3527640F38F7A72407093F16A IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('518227F3-5276-40F3-8F7A-72407093F16A', N'Sprinter W907', 'mercedes-benz-sprinter-w907', @parentId_518227F3527640F38F7A72407093F16A, NULL, NULL, 31, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mercedes-benz-vito-w638' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_5AD40587A74143589B6109960493D128 uniqueidentifier
    SELECT @parentId_5AD40587A74143589B6109960493D128 = Id FROM Categories WHERE Slug = 'mercedes-benz' AND IsDeleted = 0
    IF @parentId_5AD40587A74143589B6109960493D128 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('5AD40587-A741-4358-9B61-09960493D128', N'Vito W638', 'mercedes-benz-vito-w638', @parentId_5AD40587A74143589B6109960493D128, NULL, NULL, 32, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mercedes-benz-vito-w639' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_0302E9B53FA943EBABBB73391287559A uniqueidentifier
    SELECT @parentId_0302E9B53FA943EBABBB73391287559A = Id FROM Categories WHERE Slug = 'mercedes-benz' AND IsDeleted = 0
    IF @parentId_0302E9B53FA943EBABBB73391287559A IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('0302E9B5-3FA9-43EB-ABBB-73391287559A', N'Vito W639', 'mercedes-benz-vito-w639', @parentId_0302E9B53FA943EBABBB73391287559A, NULL, NULL, 33, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mercedes-benz-vito-w447' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_553D72E7A4A94962963B487560662AF9 uniqueidentifier
    SELECT @parentId_553D72E7A4A94962963B487560662AF9 = Id FROM Categories WHERE Slug = 'mercedes-benz' AND IsDeleted = 0
    IF @parentId_553D72E7A4A94962963B487560662AF9 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('553D72E7-A4A9-4962-963B-487560662AF9', N'Vito W447', 'mercedes-benz-vito-w447', @parentId_553D72E7A4A94962963B487560662AF9, NULL, NULL, 34, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volkswagen' AND IsDeleted = 0)
BEGIN
    INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
    VALUES ('3773F21A-EA91-4F18-8551-E15F209218C7', N'Volkswagen', 'volkswagen', NULL, NULL, NULL, 4, 1, 1, 1, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
ELSE
BEGIN
    -- Varsa ShowInVehicleNav=true gÃ¼ncelle
    UPDATE Categories SET ShowInVehicleNav = 1 WHERE Slug = 'volkswagen' AND IsDeleted = 0
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volkswagen-golf-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_7879AE43E371418C9F0DFA3BB266018F uniqueidentifier
    SELECT @parentId_7879AE43E371418C9F0DFA3BB266018F = Id FROM Categories WHERE Slug = 'volkswagen' AND IsDeleted = 0
    IF @parentId_7879AE43E371418C9F0DFA3BB266018F IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('7879AE43-E371-418C-9F0D-FA3BB266018F', N'Golf I', 'volkswagen-golf-i', @parentId_7879AE43E371418C9F0DFA3BB266018F, NULL, NULL, 0, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volkswagen-golf-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_3AD078FB18314211A6EA085B71537405 uniqueidentifier
    SELECT @parentId_3AD078FB18314211A6EA085B71537405 = Id FROM Categories WHERE Slug = 'volkswagen' AND IsDeleted = 0
    IF @parentId_3AD078FB18314211A6EA085B71537405 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('3AD078FB-1831-4211-A6EA-085B71537405', N'Golf II', 'volkswagen-golf-ii', @parentId_3AD078FB18314211A6EA085B71537405, NULL, NULL, 1, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volkswagen-golf-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_771E79E99FA34535BB34E9187F4483CB uniqueidentifier
    SELECT @parentId_771E79E99FA34535BB34E9187F4483CB = Id FROM Categories WHERE Slug = 'volkswagen' AND IsDeleted = 0
    IF @parentId_771E79E99FA34535BB34E9187F4483CB IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('771E79E9-9FA3-4535-BB34-E9187F4483CB', N'Golf III', 'volkswagen-golf-iii', @parentId_771E79E99FA34535BB34E9187F4483CB, NULL, NULL, 2, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volkswagen-golf-iv' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_1504EDC678BC409E8771A341F3DA4603 uniqueidentifier
    SELECT @parentId_1504EDC678BC409E8771A341F3DA4603 = Id FROM Categories WHERE Slug = 'volkswagen' AND IsDeleted = 0
    IF @parentId_1504EDC678BC409E8771A341F3DA4603 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('1504EDC6-78BC-409E-8771-A341F3DA4603', N'Golf IV', 'volkswagen-golf-iv', @parentId_1504EDC678BC409E8771A341F3DA4603, NULL, NULL, 3, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volkswagen-golf-v' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_0ED22B4112CC4610884C65DFE5B19C26 uniqueidentifier
    SELECT @parentId_0ED22B4112CC4610884C65DFE5B19C26 = Id FROM Categories WHERE Slug = 'volkswagen' AND IsDeleted = 0
    IF @parentId_0ED22B4112CC4610884C65DFE5B19C26 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('0ED22B41-12CC-4610-884C-65DFE5B19C26', N'Golf V', 'volkswagen-golf-v', @parentId_0ED22B4112CC4610884C65DFE5B19C26, NULL, NULL, 4, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volkswagen-golf-vi' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_2EFADAE707304F5CAD7D13784518E7B8 uniqueidentifier
    SELECT @parentId_2EFADAE707304F5CAD7D13784518E7B8 = Id FROM Categories WHERE Slug = 'volkswagen' AND IsDeleted = 0
    IF @parentId_2EFADAE707304F5CAD7D13784518E7B8 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('2EFADAE7-0730-4F5C-AD7D-13784518E7B8', N'Golf VI', 'volkswagen-golf-vi', @parentId_2EFADAE707304F5CAD7D13784518E7B8, NULL, NULL, 5, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volkswagen-golf-vii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_FBDE1BC9216240D68106D7A268057235 uniqueidentifier
    SELECT @parentId_FBDE1BC9216240D68106D7A268057235 = Id FROM Categories WHERE Slug = 'volkswagen' AND IsDeleted = 0
    IF @parentId_FBDE1BC9216240D68106D7A268057235 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('FBDE1BC9-2162-40D6-8106-D7A268057235', N'Golf VII', 'volkswagen-golf-vii', @parentId_FBDE1BC9216240D68106D7A268057235, NULL, NULL, 6, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volkswagen-golf-viii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_989796AC97E744B99441EF05D4F99526 uniqueidentifier
    SELECT @parentId_989796AC97E744B99441EF05D4F99526 = Id FROM Categories WHERE Slug = 'volkswagen' AND IsDeleted = 0
    IF @parentId_989796AC97E744B99441EF05D4F99526 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('989796AC-97E7-44B9-9441-EF05D4F99526', N'Golf VIII', 'volkswagen-golf-viii', @parentId_989796AC97E744B99441EF05D4F99526, NULL, NULL, 7, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volkswagen-passat-b3' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_528B49DADE37448683B6DDF7E77FF113 uniqueidentifier
    SELECT @parentId_528B49DADE37448683B6DDF7E77FF113 = Id FROM Categories WHERE Slug = 'volkswagen' AND IsDeleted = 0
    IF @parentId_528B49DADE37448683B6DDF7E77FF113 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('528B49DA-DE37-4486-83B6-DDF7E77FF113', N'Passat B3', 'volkswagen-passat-b3', @parentId_528B49DADE37448683B6DDF7E77FF113, NULL, NULL, 8, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volkswagen-passat-b4' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_B2B9F26B75E24A73BD30DFDDC06F60D8 uniqueidentifier
    SELECT @parentId_B2B9F26B75E24A73BD30DFDDC06F60D8 = Id FROM Categories WHERE Slug = 'volkswagen' AND IsDeleted = 0
    IF @parentId_B2B9F26B75E24A73BD30DFDDC06F60D8 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('B2B9F26B-75E2-4A73-BD30-DFDDC06F60D8', N'Passat B4', 'volkswagen-passat-b4', @parentId_B2B9F26B75E24A73BD30DFDDC06F60D8, NULL, NULL, 9, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volkswagen-passat-b5' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_6071E2F76253465BA940D98C91976235 uniqueidentifier
    SELECT @parentId_6071E2F76253465BA940D98C91976235 = Id FROM Categories WHERE Slug = 'volkswagen' AND IsDeleted = 0
    IF @parentId_6071E2F76253465BA940D98C91976235 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('6071E2F7-6253-465B-A940-D98C91976235', N'Passat B5', 'volkswagen-passat-b5', @parentId_6071E2F76253465BA940D98C91976235, NULL, NULL, 10, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volkswagen-passat-b6' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_E7800B531DCE4F768BF977396689E7B5 uniqueidentifier
    SELECT @parentId_E7800B531DCE4F768BF977396689E7B5 = Id FROM Categories WHERE Slug = 'volkswagen' AND IsDeleted = 0
    IF @parentId_E7800B531DCE4F768BF977396689E7B5 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('E7800B53-1DCE-4F76-8BF9-77396689E7B5', N'Passat B6', 'volkswagen-passat-b6', @parentId_E7800B531DCE4F768BF977396689E7B5, NULL, NULL, 11, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volkswagen-passat-b7' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_038D8151C0AD4A6686D1CB8B87EAA10C uniqueidentifier
    SELECT @parentId_038D8151C0AD4A6686D1CB8B87EAA10C = Id FROM Categories WHERE Slug = 'volkswagen' AND IsDeleted = 0
    IF @parentId_038D8151C0AD4A6686D1CB8B87EAA10C IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('038D8151-C0AD-4A66-86D1-CB8B87EAA10C', N'Passat B7', 'volkswagen-passat-b7', @parentId_038D8151C0AD4A6686D1CB8B87EAA10C, NULL, NULL, 12, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volkswagen-passat-b8' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_4E16964FBE224A428D87AFCF90CD4B9D uniqueidentifier
    SELECT @parentId_4E16964FBE224A428D87AFCF90CD4B9D = Id FROM Categories WHERE Slug = 'volkswagen' AND IsDeleted = 0
    IF @parentId_4E16964FBE224A428D87AFCF90CD4B9D IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('4E16964F-BE22-4A42-8D87-AFCF90CD4B9D', N'Passat B8', 'volkswagen-passat-b8', @parentId_4E16964FBE224A428D87AFCF90CD4B9D, NULL, NULL, 13, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volkswagen-polo-6n' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_4B8370CBC87041CBA088E0A55351C0D3 uniqueidentifier
    SELECT @parentId_4B8370CBC87041CBA088E0A55351C0D3 = Id FROM Categories WHERE Slug = 'volkswagen' AND IsDeleted = 0
    IF @parentId_4B8370CBC87041CBA088E0A55351C0D3 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('4B8370CB-C870-41CB-A088-E0A55351C0D3', N'Polo 6N', 'volkswagen-polo-6n', @parentId_4B8370CBC87041CBA088E0A55351C0D3, NULL, NULL, 14, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volkswagen-polo-6n2' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_B7778CFC5657475E8998ACBE2E9B28A9 uniqueidentifier
    SELECT @parentId_B7778CFC5657475E8998ACBE2E9B28A9 = Id FROM Categories WHERE Slug = 'volkswagen' AND IsDeleted = 0
    IF @parentId_B7778CFC5657475E8998ACBE2E9B28A9 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('B7778CFC-5657-475E-8998-ACBE2E9B28A9', N'Polo 6N2', 'volkswagen-polo-6n2', @parentId_B7778CFC5657475E8998ACBE2E9B28A9, NULL, NULL, 15, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volkswagen-polo-9n' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_E372423F46E24F978E6FD3D874062AD2 uniqueidentifier
    SELECT @parentId_E372423F46E24F978E6FD3D874062AD2 = Id FROM Categories WHERE Slug = 'volkswagen' AND IsDeleted = 0
    IF @parentId_E372423F46E24F978E6FD3D874062AD2 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('E372423F-46E2-4F97-8E6F-D3D874062AD2', N'Polo 9N', 'volkswagen-polo-9n', @parentId_E372423F46E24F978E6FD3D874062AD2, NULL, NULL, 16, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volkswagen-polo-6r' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_F20551C902D44AF997A11DE6D8F98406 uniqueidentifier
    SELECT @parentId_F20551C902D44AF997A11DE6D8F98406 = Id FROM Categories WHERE Slug = 'volkswagen' AND IsDeleted = 0
    IF @parentId_F20551C902D44AF997A11DE6D8F98406 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('F20551C9-02D4-4AF9-97A1-1DE6D8F98406', N'Polo 6R', 'volkswagen-polo-6r', @parentId_F20551C902D44AF997A11DE6D8F98406, NULL, NULL, 17, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volkswagen-polo-aw' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_26448FA9B67949C0A78CB59BDD73AF74 uniqueidentifier
    SELECT @parentId_26448FA9B67949C0A78CB59BDD73AF74 = Id FROM Categories WHERE Slug = 'volkswagen' AND IsDeleted = 0
    IF @parentId_26448FA9B67949C0A78CB59BDD73AF74 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('26448FA9-B679-49C0-A78C-B59BDD73AF74', N'Polo AW', 'volkswagen-polo-aw', @parentId_26448FA9B67949C0A78CB59BDD73AF74, NULL, NULL, 18, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volkswagen-tiguan-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_B54C10FA66194504968A52695F820CD2 uniqueidentifier
    SELECT @parentId_B54C10FA66194504968A52695F820CD2 = Id FROM Categories WHERE Slug = 'volkswagen' AND IsDeleted = 0
    IF @parentId_B54C10FA66194504968A52695F820CD2 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('B54C10FA-6619-4504-968A-52695F820CD2', N'Tiguan I', 'volkswagen-tiguan-i', @parentId_B54C10FA66194504968A52695F820CD2, NULL, NULL, 19, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volkswagen-tiguan-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_9EA6EB1079D648589F680DCD04727EA1 uniqueidentifier
    SELECT @parentId_9EA6EB1079D648589F680DCD04727EA1 = Id FROM Categories WHERE Slug = 'volkswagen' AND IsDeleted = 0
    IF @parentId_9EA6EB1079D648589F680DCD04727EA1 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('9EA6EB10-79D6-4858-9F68-0DCD04727EA1', N'Tiguan II', 'volkswagen-tiguan-ii', @parentId_9EA6EB1079D648589F680DCD04727EA1, NULL, NULL, 20, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volkswagen-touareg-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_FA2CB9769D984C0F9EA4A24F758C8734 uniqueidentifier
    SELECT @parentId_FA2CB9769D984C0F9EA4A24F758C8734 = Id FROM Categories WHERE Slug = 'volkswagen' AND IsDeleted = 0
    IF @parentId_FA2CB9769D984C0F9EA4A24F758C8734 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('FA2CB976-9D98-4C0F-9EA4-A24F758C8734', N'Touareg I', 'volkswagen-touareg-i', @parentId_FA2CB9769D984C0F9EA4A24F758C8734, NULL, NULL, 21, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volkswagen-touareg-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_2BD01C6226084F4DA24A74147791E62C uniqueidentifier
    SELECT @parentId_2BD01C6226084F4DA24A74147791E62C = Id FROM Categories WHERE Slug = 'volkswagen' AND IsDeleted = 0
    IF @parentId_2BD01C6226084F4DA24A74147791E62C IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('2BD01C62-2608-4F4D-A24A-74147791E62C', N'Touareg II', 'volkswagen-touareg-ii', @parentId_2BD01C6226084F4DA24A74147791E62C, NULL, NULL, 22, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volkswagen-touareg-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_EA88C9B7DEB547DFADAFFC9E47658292 uniqueidentifier
    SELECT @parentId_EA88C9B7DEB547DFADAFFC9E47658292 = Id FROM Categories WHERE Slug = 'volkswagen' AND IsDeleted = 0
    IF @parentId_EA88C9B7DEB547DFADAFFC9E47658292 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('EA88C9B7-DEB5-47DF-ADAF-FC9E47658292', N'Touareg III', 'volkswagen-touareg-iii', @parentId_EA88C9B7DEB547DFADAFFC9E47658292, NULL, NULL, 23, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volkswagen-t-roc' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_7343F81BDE244814845E0F2C68851A21 uniqueidentifier
    SELECT @parentId_7343F81BDE244814845E0F2C68851A21 = Id FROM Categories WHERE Slug = 'volkswagen' AND IsDeleted = 0
    IF @parentId_7343F81BDE244814845E0F2C68851A21 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('7343F81B-DE24-4814-845E-0F2C68851A21', N'T-Roc', 'volkswagen-t-roc', @parentId_7343F81BDE244814845E0F2C68851A21, NULL, NULL, 24, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volkswagen-t-cross' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_2072B02685F9489C93BF7DF83CA500B6 uniqueidentifier
    SELECT @parentId_2072B02685F9489C93BF7DF83CA500B6 = Id FROM Categories WHERE Slug = 'volkswagen' AND IsDeleted = 0
    IF @parentId_2072B02685F9489C93BF7DF83CA500B6 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('2072B026-85F9-489C-93BF-7DF83CA500B6', N'T-Cross', 'volkswagen-t-cross', @parentId_2072B02685F9489C93BF7DF83CA500B6, NULL, NULL, 25, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volkswagen-arteon' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_A70DB5946BB24F079B8546BC219B3039 uniqueidentifier
    SELECT @parentId_A70DB5946BB24F079B8546BC219B3039 = Id FROM Categories WHERE Slug = 'volkswagen' AND IsDeleted = 0
    IF @parentId_A70DB5946BB24F079B8546BC219B3039 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('A70DB594-6BB2-4F07-9B85-46BC219B3039', N'Arteon', 'volkswagen-arteon', @parentId_A70DB5946BB24F079B8546BC219B3039, NULL, NULL, 26, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volkswagen-caddy-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_45C71054A6344941826CCA38516066F5 uniqueidentifier
    SELECT @parentId_45C71054A6344941826CCA38516066F5 = Id FROM Categories WHERE Slug = 'volkswagen' AND IsDeleted = 0
    IF @parentId_45C71054A6344941826CCA38516066F5 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('45C71054-A634-4941-826C-CA38516066F5', N'Caddy I', 'volkswagen-caddy-i', @parentId_45C71054A6344941826CCA38516066F5, NULL, NULL, 27, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volkswagen-caddy-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_7D95256237D74C5EB79A1558064D6F91 uniqueidentifier
    SELECT @parentId_7D95256237D74C5EB79A1558064D6F91 = Id FROM Categories WHERE Slug = 'volkswagen' AND IsDeleted = 0
    IF @parentId_7D95256237D74C5EB79A1558064D6F91 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('7D952562-37D7-4C5E-B79A-1558064D6F91', N'Caddy II', 'volkswagen-caddy-ii', @parentId_7D95256237D74C5EB79A1558064D6F91, NULL, NULL, 28, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volkswagen-caddy-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_9CF2491B68B149E3B248564CD492A7B7 uniqueidentifier
    SELECT @parentId_9CF2491B68B149E3B248564CD492A7B7 = Id FROM Categories WHERE Slug = 'volkswagen' AND IsDeleted = 0
    IF @parentId_9CF2491B68B149E3B248564CD492A7B7 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('9CF2491B-68B1-49E3-B248-564CD492A7B7', N'Caddy III', 'volkswagen-caddy-iii', @parentId_9CF2491B68B149E3B248564CD492A7B7, NULL, NULL, 29, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volkswagen-caddy-iv' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_5FA198BBBF01469DB094D86389E8E7EF uniqueidentifier
    SELECT @parentId_5FA198BBBF01469DB094D86389E8E7EF = Id FROM Categories WHERE Slug = 'volkswagen' AND IsDeleted = 0
    IF @parentId_5FA198BBBF01469DB094D86389E8E7EF IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('5FA198BB-BF01-469D-B094-D86389E8E7EF', N'Caddy IV', 'volkswagen-caddy-iv', @parentId_5FA198BBBF01469DB094D86389E8E7EF, NULL, NULL, 30, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volkswagen-transporter-t4' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_6A23F3237BB849E18E9F64EC01199755 uniqueidentifier
    SELECT @parentId_6A23F3237BB849E18E9F64EC01199755 = Id FROM Categories WHERE Slug = 'volkswagen' AND IsDeleted = 0
    IF @parentId_6A23F3237BB849E18E9F64EC01199755 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('6A23F323-7BB8-49E1-8E9F-64EC01199755', N'Transporter T4', 'volkswagen-transporter-t4', @parentId_6A23F3237BB849E18E9F64EC01199755, NULL, NULL, 31, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volkswagen-transporter-t5' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_6AC5199C43974B529E64354A88460AE4 uniqueidentifier
    SELECT @parentId_6AC5199C43974B529E64354A88460AE4 = Id FROM Categories WHERE Slug = 'volkswagen' AND IsDeleted = 0
    IF @parentId_6AC5199C43974B529E64354A88460AE4 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('6AC5199C-4397-4B52-9E64-354A88460AE4', N'Transporter T5', 'volkswagen-transporter-t5', @parentId_6AC5199C43974B529E64354A88460AE4, NULL, NULL, 32, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volkswagen-transporter-t6' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_824ECB75486B43128537BBDDF000CB88 uniqueidentifier
    SELECT @parentId_824ECB75486B43128537BBDDF000CB88 = Id FROM Categories WHERE Slug = 'volkswagen' AND IsDeleted = 0
    IF @parentId_824ECB75486B43128537BBDDF000CB88 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('824ECB75-486B-4312-8537-BBDDF000CB88', N'Transporter T6', 'volkswagen-transporter-t6', @parentId_824ECB75486B43128537BBDDF000CB88, NULL, NULL, 33, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volkswagen-amarok-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_500E9FC636024D94BD6AB6B4071F02AC uniqueidentifier
    SELECT @parentId_500E9FC636024D94BD6AB6B4071F02AC = Id FROM Categories WHERE Slug = 'volkswagen' AND IsDeleted = 0
    IF @parentId_500E9FC636024D94BD6AB6B4071F02AC IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('500E9FC6-3602-4D94-BD6A-B6B4071F02AC', N'Amarok I', 'volkswagen-amarok-i', @parentId_500E9FC636024D94BD6AB6B4071F02AC, NULL, NULL, 34, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volkswagen-amarok-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_307EFF780BBE403F9D914CC33FFFD888 uniqueidentifier
    SELECT @parentId_307EFF780BBE403F9D914CC33FFFD888 = Id FROM Categories WHERE Slug = 'volkswagen' AND IsDeleted = 0
    IF @parentId_307EFF780BBE403F9D914CC33FFFD888 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('307EFF78-0BBE-403F-9D91-4CC33FFFD888', N'Amarok II', 'volkswagen-amarok-ii', @parentId_307EFF780BBE403F9D914CC33FFFD888, NULL, NULL, 35, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volkswagen-sharan-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_C7946B57E2A64A0CB4371D0CB33A487B uniqueidentifier
    SELECT @parentId_C7946B57E2A64A0CB4371D0CB33A487B = Id FROM Categories WHERE Slug = 'volkswagen' AND IsDeleted = 0
    IF @parentId_C7946B57E2A64A0CB4371D0CB33A487B IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('C7946B57-E2A6-4A0C-B437-1D0CB33A487B', N'Sharan I', 'volkswagen-sharan-i', @parentId_C7946B57E2A64A0CB4371D0CB33A487B, NULL, NULL, 36, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volkswagen-sharan-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_6DE7F381AFF3406DA6BBBDD8EBC97AA0 uniqueidentifier
    SELECT @parentId_6DE7F381AFF3406DA6BBBDD8EBC97AA0 = Id FROM Categories WHERE Slug = 'volkswagen' AND IsDeleted = 0
    IF @parentId_6DE7F381AFF3406DA6BBBDD8EBC97AA0 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('6DE7F381-AFF3-406D-A6BB-BDD8EBC97AA0', N'Sharan II', 'volkswagen-sharan-ii', @parentId_6DE7F381AFF3406DA6BBBDD8EBC97AA0, NULL, NULL, 37, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volkswagen-id3' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_A37B10F3823D4BE39D43B25DC1591F2F uniqueidentifier
    SELECT @parentId_A37B10F3823D4BE39D43B25DC1591F2F = Id FROM Categories WHERE Slug = 'volkswagen' AND IsDeleted = 0
    IF @parentId_A37B10F3823D4BE39D43B25DC1591F2F IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('A37B10F3-823D-4BE3-9D43-B25DC1591F2F', N'ID.3', 'volkswagen-id3', @parentId_A37B10F3823D4BE39D43B25DC1591F2F, NULL, NULL, 38, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volkswagen-id4' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_F21C191C0DC34E86804F52596EBA9E5A uniqueidentifier
    SELECT @parentId_F21C191C0DC34E86804F52596EBA9E5A = Id FROM Categories WHERE Slug = 'volkswagen' AND IsDeleted = 0
    IF @parentId_F21C191C0DC34E86804F52596EBA9E5A IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('F21C191C-0DC3-4E86-804F-52596EBA9E5A', N'ID.4', 'volkswagen-id4', @parentId_F21C191C0DC34E86804F52596EBA9E5A, NULL, NULL, 39, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'audi' AND IsDeleted = 0)
BEGIN
    INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
    VALUES ('7002DCA1-056D-45F8-91E1-00111855F1B0', N'Audi', 'audi', NULL, NULL, NULL, 5, 1, 1, 1, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
ELSE
BEGIN
    -- Varsa ShowInVehicleNav=true gÃ¼ncelle
    UPDATE Categories SET ShowInVehicleNav = 1 WHERE Slug = 'audi' AND IsDeleted = 0
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'audi-a1-8x' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_F89E19F99B334A14A0362F21EE329E4E uniqueidentifier
    SELECT @parentId_F89E19F99B334A14A0362F21EE329E4E = Id FROM Categories WHERE Slug = 'audi' AND IsDeleted = 0
    IF @parentId_F89E19F99B334A14A0362F21EE329E4E IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('F89E19F9-9B33-4A14-A036-2F21EE329E4E', N'A1 8X', 'audi-a1-8x', @parentId_F89E19F99B334A14A0362F21EE329E4E, NULL, NULL, 0, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'audi-a1-gb' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_53298D4914FE45EBACFC49DA109F4F7F uniqueidentifier
    SELECT @parentId_53298D4914FE45EBACFC49DA109F4F7F = Id FROM Categories WHERE Slug = 'audi' AND IsDeleted = 0
    IF @parentId_53298D4914FE45EBACFC49DA109F4F7F IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('53298D49-14FE-45EB-ACFC-49DA109F4F7F', N'A1 GB', 'audi-a1-gb', @parentId_53298D4914FE45EBACFC49DA109F4F7F, NULL, NULL, 1, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'audi-a3-8l' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_5FFCC110BF7144C5BFC35072AA7CB178 uniqueidentifier
    SELECT @parentId_5FFCC110BF7144C5BFC35072AA7CB178 = Id FROM Categories WHERE Slug = 'audi' AND IsDeleted = 0
    IF @parentId_5FFCC110BF7144C5BFC35072AA7CB178 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('5FFCC110-BF71-44C5-BFC3-5072AA7CB178', N'A3 8L', 'audi-a3-8l', @parentId_5FFCC110BF7144C5BFC35072AA7CB178, NULL, NULL, 2, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'audi-a3-8p' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_7900BBEB4975436CAC08CA3547C70EC4 uniqueidentifier
    SELECT @parentId_7900BBEB4975436CAC08CA3547C70EC4 = Id FROM Categories WHERE Slug = 'audi' AND IsDeleted = 0
    IF @parentId_7900BBEB4975436CAC08CA3547C70EC4 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('7900BBEB-4975-436C-AC08-CA3547C70EC4', N'A3 8P', 'audi-a3-8p', @parentId_7900BBEB4975436CAC08CA3547C70EC4, NULL, NULL, 3, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'audi-a3-8v' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_42592AE5F8914A9FAB1A22B7D12AC15F uniqueidentifier
    SELECT @parentId_42592AE5F8914A9FAB1A22B7D12AC15F = Id FROM Categories WHERE Slug = 'audi' AND IsDeleted = 0
    IF @parentId_42592AE5F8914A9FAB1A22B7D12AC15F IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('42592AE5-F891-4A9F-AB1A-22B7D12AC15F', N'A3 8V', 'audi-a3-8v', @parentId_42592AE5F8914A9FAB1A22B7D12AC15F, NULL, NULL, 4, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'audi-a3-8y' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_1ED2919C14A2418C98CF1C0D2ADCFEBD uniqueidentifier
    SELECT @parentId_1ED2919C14A2418C98CF1C0D2ADCFEBD = Id FROM Categories WHERE Slug = 'audi' AND IsDeleted = 0
    IF @parentId_1ED2919C14A2418C98CF1C0D2ADCFEBD IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('1ED2919C-14A2-418C-98CF-1C0D2ADCFEBD', N'A3 8Y', 'audi-a3-8y', @parentId_1ED2919C14A2418C98CF1C0D2ADCFEBD, NULL, NULL, 5, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'audi-a4-b5' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_B23276B93D544D5FAF38642ECD9CC761 uniqueidentifier
    SELECT @parentId_B23276B93D544D5FAF38642ECD9CC761 = Id FROM Categories WHERE Slug = 'audi' AND IsDeleted = 0
    IF @parentId_B23276B93D544D5FAF38642ECD9CC761 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('B23276B9-3D54-4D5F-AF38-642ECD9CC761', N'A4 B5', 'audi-a4-b5', @parentId_B23276B93D544D5FAF38642ECD9CC761, NULL, NULL, 6, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'audi-a4-b6' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_91200EAAC1664717A27F9E16549446D7 uniqueidentifier
    SELECT @parentId_91200EAAC1664717A27F9E16549446D7 = Id FROM Categories WHERE Slug = 'audi' AND IsDeleted = 0
    IF @parentId_91200EAAC1664717A27F9E16549446D7 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('91200EAA-C166-4717-A27F-9E16549446D7', N'A4 B6', 'audi-a4-b6', @parentId_91200EAAC1664717A27F9E16549446D7, NULL, NULL, 7, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'audi-a4-b7' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_CEFA5F450FD64191AF03FCD0A7361E22 uniqueidentifier
    SELECT @parentId_CEFA5F450FD64191AF03FCD0A7361E22 = Id FROM Categories WHERE Slug = 'audi' AND IsDeleted = 0
    IF @parentId_CEFA5F450FD64191AF03FCD0A7361E22 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('CEFA5F45-0FD6-4191-AF03-FCD0A7361E22', N'A4 B7', 'audi-a4-b7', @parentId_CEFA5F450FD64191AF03FCD0A7361E22, NULL, NULL, 8, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'audi-a4-b8' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_459BC7117ABB4058BE6F4EA78DE6DC38 uniqueidentifier
    SELECT @parentId_459BC7117ABB4058BE6F4EA78DE6DC38 = Id FROM Categories WHERE Slug = 'audi' AND IsDeleted = 0
    IF @parentId_459BC7117ABB4058BE6F4EA78DE6DC38 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('459BC711-7ABB-4058-BE6F-4EA78DE6DC38', N'A4 B8', 'audi-a4-b8', @parentId_459BC7117ABB4058BE6F4EA78DE6DC38, NULL, NULL, 9, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'audi-a4-b9' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_F3B82BD633D0466BA7367BB98E3FFBEA uniqueidentifier
    SELECT @parentId_F3B82BD633D0466BA7367BB98E3FFBEA = Id FROM Categories WHERE Slug = 'audi' AND IsDeleted = 0
    IF @parentId_F3B82BD633D0466BA7367BB98E3FFBEA IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('F3B82BD6-33D0-466B-A736-7BB98E3FFBEA', N'A4 B9', 'audi-a4-b9', @parentId_F3B82BD633D0466BA7367BB98E3FFBEA, NULL, NULL, 10, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'audi-a5-8t' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_707A56B778434065BF61825F0C27A633 uniqueidentifier
    SELECT @parentId_707A56B778434065BF61825F0C27A633 = Id FROM Categories WHERE Slug = 'audi' AND IsDeleted = 0
    IF @parentId_707A56B778434065BF61825F0C27A633 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('707A56B7-7843-4065-BF61-825F0C27A633', N'A5 8T', 'audi-a5-8t', @parentId_707A56B778434065BF61825F0C27A633, NULL, NULL, 11, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'audi-a5-f5' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_1A8408A4AE484120AEEB55680407ECBA uniqueidentifier
    SELECT @parentId_1A8408A4AE484120AEEB55680407ECBA = Id FROM Categories WHERE Slug = 'audi' AND IsDeleted = 0
    IF @parentId_1A8408A4AE484120AEEB55680407ECBA IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('1A8408A4-AE48-4120-AEEB-55680407ECBA', N'A5 F5', 'audi-a5-f5', @parentId_1A8408A4AE484120AEEB55680407ECBA, NULL, NULL, 12, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'audi-a6-c4' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_544EB336698441CE9489042C1C60D31C uniqueidentifier
    SELECT @parentId_544EB336698441CE9489042C1C60D31C = Id FROM Categories WHERE Slug = 'audi' AND IsDeleted = 0
    IF @parentId_544EB336698441CE9489042C1C60D31C IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('544EB336-6984-41CE-9489-042C1C60D31C', N'A6 C4', 'audi-a6-c4', @parentId_544EB336698441CE9489042C1C60D31C, NULL, NULL, 13, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'audi-a6-c5' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_1946654E3170469283D91E6350DCEB15 uniqueidentifier
    SELECT @parentId_1946654E3170469283D91E6350DCEB15 = Id FROM Categories WHERE Slug = 'audi' AND IsDeleted = 0
    IF @parentId_1946654E3170469283D91E6350DCEB15 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('1946654E-3170-4692-83D9-1E6350DCEB15', N'A6 C5', 'audi-a6-c5', @parentId_1946654E3170469283D91E6350DCEB15, NULL, NULL, 14, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'audi-a6-c6' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_76EDE451BA8C49C8A27AF4BC4ED820F3 uniqueidentifier
    SELECT @parentId_76EDE451BA8C49C8A27AF4BC4ED820F3 = Id FROM Categories WHERE Slug = 'audi' AND IsDeleted = 0
    IF @parentId_76EDE451BA8C49C8A27AF4BC4ED820F3 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('76EDE451-BA8C-49C8-A27A-F4BC4ED820F3', N'A6 C6', 'audi-a6-c6', @parentId_76EDE451BA8C49C8A27AF4BC4ED820F3, NULL, NULL, 15, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'audi-a6-c7' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_8009B5A2377F4EE6A3F0233F4039E8F8 uniqueidentifier
    SELECT @parentId_8009B5A2377F4EE6A3F0233F4039E8F8 = Id FROM Categories WHERE Slug = 'audi' AND IsDeleted = 0
    IF @parentId_8009B5A2377F4EE6A3F0233F4039E8F8 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('8009B5A2-377F-4EE6-A3F0-233F4039E8F8', N'A6 C7', 'audi-a6-c7', @parentId_8009B5A2377F4EE6A3F0233F4039E8F8, NULL, NULL, 16, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'audi-a6-c8' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_0ED62110EF0F4FE58FB1F4934AE44694 uniqueidentifier
    SELECT @parentId_0ED62110EF0F4FE58FB1F4934AE44694 = Id FROM Categories WHERE Slug = 'audi' AND IsDeleted = 0
    IF @parentId_0ED62110EF0F4FE58FB1F4934AE44694 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('0ED62110-EF0F-4FE5-8FB1-F4934AE44694', N'A6 C8', 'audi-a6-c8', @parentId_0ED62110EF0F4FE58FB1F4934AE44694, NULL, NULL, 17, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'audi-a7-4g' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_9E3D26E3C1C54DC8A1643A41BF8476FB uniqueidentifier
    SELECT @parentId_9E3D26E3C1C54DC8A1643A41BF8476FB = Id FROM Categories WHERE Slug = 'audi' AND IsDeleted = 0
    IF @parentId_9E3D26E3C1C54DC8A1643A41BF8476FB IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('9E3D26E3-C1C5-4DC8-A164-3A41BF8476FB', N'A7 4G', 'audi-a7-4g', @parentId_9E3D26E3C1C54DC8A1643A41BF8476FB, NULL, NULL, 18, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'audi-a7-4k' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_B4FC13AD187F4741A33B719F93FAACED uniqueidentifier
    SELECT @parentId_B4FC13AD187F4741A33B719F93FAACED = Id FROM Categories WHERE Slug = 'audi' AND IsDeleted = 0
    IF @parentId_B4FC13AD187F4741A33B719F93FAACED IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('B4FC13AD-187F-4741-A33B-719F93FAACED', N'A7 4K', 'audi-a7-4k', @parentId_B4FC13AD187F4741A33B719F93FAACED, NULL, NULL, 19, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'audi-a8-d2' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_CC57C6A1E52B43298B22ED6F9DB59EFE uniqueidentifier
    SELECT @parentId_CC57C6A1E52B43298B22ED6F9DB59EFE = Id FROM Categories WHERE Slug = 'audi' AND IsDeleted = 0
    IF @parentId_CC57C6A1E52B43298B22ED6F9DB59EFE IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('CC57C6A1-E52B-4329-8B22-ED6F9DB59EFE', N'A8 D2', 'audi-a8-d2', @parentId_CC57C6A1E52B43298B22ED6F9DB59EFE, NULL, NULL, 20, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'audi-a8-d3' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_DA612FDDDF26401A85387DB33496D90F uniqueidentifier
    SELECT @parentId_DA612FDDDF26401A85387DB33496D90F = Id FROM Categories WHERE Slug = 'audi' AND IsDeleted = 0
    IF @parentId_DA612FDDDF26401A85387DB33496D90F IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('DA612FDD-DF26-401A-8538-7DB33496D90F', N'A8 D3', 'audi-a8-d3', @parentId_DA612FDDDF26401A85387DB33496D90F, NULL, NULL, 21, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'audi-a8-d4' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_1C7D7CE07AFE4DCA97D1620CF33DCBBA uniqueidentifier
    SELECT @parentId_1C7D7CE07AFE4DCA97D1620CF33DCBBA = Id FROM Categories WHERE Slug = 'audi' AND IsDeleted = 0
    IF @parentId_1C7D7CE07AFE4DCA97D1620CF33DCBBA IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('1C7D7CE0-7AFE-4DCA-97D1-620CF33DCBBA', N'A8 D4', 'audi-a8-d4', @parentId_1C7D7CE07AFE4DCA97D1620CF33DCBBA, NULL, NULL, 22, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'audi-a8-d5' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_6359645503854F6DAFE24B2621856C8A uniqueidentifier
    SELECT @parentId_6359645503854F6DAFE24B2621856C8A = Id FROM Categories WHERE Slug = 'audi' AND IsDeleted = 0
    IF @parentId_6359645503854F6DAFE24B2621856C8A IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('63596455-0385-4F6D-AFE2-4B2621856C8A', N'A8 D5', 'audi-a8-d5', @parentId_6359645503854F6DAFE24B2621856C8A, NULL, NULL, 23, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'audi-q2' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_113E0E706B0E4819A480B3EB93309EAF uniqueidentifier
    SELECT @parentId_113E0E706B0E4819A480B3EB93309EAF = Id FROM Categories WHERE Slug = 'audi' AND IsDeleted = 0
    IF @parentId_113E0E706B0E4819A480B3EB93309EAF IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('113E0E70-6B0E-4819-A480-B3EB93309EAF', N'Q2', 'audi-q2', @parentId_113E0E706B0E4819A480B3EB93309EAF, NULL, NULL, 24, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'audi-q3-8u' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_749EB0455C8B4C4EBE558CBF6FC3DF1A uniqueidentifier
    SELECT @parentId_749EB0455C8B4C4EBE558CBF6FC3DF1A = Id FROM Categories WHERE Slug = 'audi' AND IsDeleted = 0
    IF @parentId_749EB0455C8B4C4EBE558CBF6FC3DF1A IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('749EB045-5C8B-4C4E-BE55-8CBF6FC3DF1A', N'Q3 8U', 'audi-q3-8u', @parentId_749EB0455C8B4C4EBE558CBF6FC3DF1A, NULL, NULL, 25, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'audi-q3-f3' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_13814B3F0935494486335AC9F7BE46DA uniqueidentifier
    SELECT @parentId_13814B3F0935494486335AC9F7BE46DA = Id FROM Categories WHERE Slug = 'audi' AND IsDeleted = 0
    IF @parentId_13814B3F0935494486335AC9F7BE46DA IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('13814B3F-0935-4944-8633-5AC9F7BE46DA', N'Q3 F3', 'audi-q3-f3', @parentId_13814B3F0935494486335AC9F7BE46DA, NULL, NULL, 26, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'audi-q5-8r' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_FE51C99315B74E9999808D16180DBA96 uniqueidentifier
    SELECT @parentId_FE51C99315B74E9999808D16180DBA96 = Id FROM Categories WHERE Slug = 'audi' AND IsDeleted = 0
    IF @parentId_FE51C99315B74E9999808D16180DBA96 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('FE51C993-15B7-4E99-9980-8D16180DBA96', N'Q5 8R', 'audi-q5-8r', @parentId_FE51C99315B74E9999808D16180DBA96, NULL, NULL, 27, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'audi-q5-fy' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_A645113147D1494CBBDB84B1402CC65E uniqueidentifier
    SELECT @parentId_A645113147D1494CBBDB84B1402CC65E = Id FROM Categories WHERE Slug = 'audi' AND IsDeleted = 0
    IF @parentId_A645113147D1494CBBDB84B1402CC65E IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('A6451131-47D1-494C-BBDB-84B1402CC65E', N'Q5 FY', 'audi-q5-fy', @parentId_A645113147D1494CBBDB84B1402CC65E, NULL, NULL, 28, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'audi-q7-4l' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_F1127222D0E743CCA7D3B62A5CA29079 uniqueidentifier
    SELECT @parentId_F1127222D0E743CCA7D3B62A5CA29079 = Id FROM Categories WHERE Slug = 'audi' AND IsDeleted = 0
    IF @parentId_F1127222D0E743CCA7D3B62A5CA29079 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('F1127222-D0E7-43CC-A7D3-B62A5CA29079', N'Q7 4L', 'audi-q7-4l', @parentId_F1127222D0E743CCA7D3B62A5CA29079, NULL, NULL, 29, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'audi-q7-4m' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_22E7D8E001B04783944513EFACC9A293 uniqueidentifier
    SELECT @parentId_22E7D8E001B04783944513EFACC9A293 = Id FROM Categories WHERE Slug = 'audi' AND IsDeleted = 0
    IF @parentId_22E7D8E001B04783944513EFACC9A293 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('22E7D8E0-01B0-4783-9445-13EFACC9A293', N'Q7 4M', 'audi-q7-4m', @parentId_22E7D8E001B04783944513EFACC9A293, NULL, NULL, 30, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'audi-q8-4m' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_93AA7E170ED14C23AD57AE8712D4EAB7 uniqueidentifier
    SELECT @parentId_93AA7E170ED14C23AD57AE8712D4EAB7 = Id FROM Categories WHERE Slug = 'audi' AND IsDeleted = 0
    IF @parentId_93AA7E170ED14C23AD57AE8712D4EAB7 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('93AA7E17-0ED1-4C23-AD57-AE8712D4EAB7', N'Q8 4M', 'audi-q8-4m', @parentId_93AA7E170ED14C23AD57AE8712D4EAB7, NULL, NULL, 31, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'audi-tt-8n' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_1DF1E77D70EB44DF9EA624A4DD27B3F8 uniqueidentifier
    SELECT @parentId_1DF1E77D70EB44DF9EA624A4DD27B3F8 = Id FROM Categories WHERE Slug = 'audi' AND IsDeleted = 0
    IF @parentId_1DF1E77D70EB44DF9EA624A4DD27B3F8 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('1DF1E77D-70EB-44DF-9EA6-24A4DD27B3F8', N'TT 8N', 'audi-tt-8n', @parentId_1DF1E77D70EB44DF9EA624A4DD27B3F8, NULL, NULL, 32, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'audi-tt-8j' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_5A31CAAC9F2445088F528ED1B7100E2D uniqueidentifier
    SELECT @parentId_5A31CAAC9F2445088F528ED1B7100E2D = Id FROM Categories WHERE Slug = 'audi' AND IsDeleted = 0
    IF @parentId_5A31CAAC9F2445088F528ED1B7100E2D IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('5A31CAAC-9F24-4508-8F52-8ED1B7100E2D', N'TT 8J', 'audi-tt-8j', @parentId_5A31CAAC9F2445088F528ED1B7100E2D, NULL, NULL, 33, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'audi-tt-8s' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_2208033F4A894013BE6C7829D9F297C4 uniqueidentifier
    SELECT @parentId_2208033F4A894013BE6C7829D9F297C4 = Id FROM Categories WHERE Slug = 'audi' AND IsDeleted = 0
    IF @parentId_2208033F4A894013BE6C7829D9F297C4 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('2208033F-4A89-4013-BE6C-7829D9F297C4', N'TT 8S', 'audi-tt-8s', @parentId_2208033F4A894013BE6C7829D9F297C4, NULL, NULL, 34, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'audi-rs3' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_EDE4EE3F95CC41928409FA0AF5FDB824 uniqueidentifier
    SELECT @parentId_EDE4EE3F95CC41928409FA0AF5FDB824 = Id FROM Categories WHERE Slug = 'audi' AND IsDeleted = 0
    IF @parentId_EDE4EE3F95CC41928409FA0AF5FDB824 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('EDE4EE3F-95CC-4192-8409-FA0AF5FDB824', N'RS3', 'audi-rs3', @parentId_EDE4EE3F95CC41928409FA0AF5FDB824, NULL, NULL, 35, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'audi-rs4-b5' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_F5E47FAA30794E17A342C5BDB76779DF uniqueidentifier
    SELECT @parentId_F5E47FAA30794E17A342C5BDB76779DF = Id FROM Categories WHERE Slug = 'audi' AND IsDeleted = 0
    IF @parentId_F5E47FAA30794E17A342C5BDB76779DF IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('F5E47FAA-3079-4E17-A342-C5BDB76779DF', N'RS4 B5', 'audi-rs4-b5', @parentId_F5E47FAA30794E17A342C5BDB76779DF, NULL, NULL, 36, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'audi-rs4-b7' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_D31E1ADD9AF74033A19DB071E1FD6681 uniqueidentifier
    SELECT @parentId_D31E1ADD9AF74033A19DB071E1FD6681 = Id FROM Categories WHERE Slug = 'audi' AND IsDeleted = 0
    IF @parentId_D31E1ADD9AF74033A19DB071E1FD6681 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('D31E1ADD-9AF7-4033-A19D-B071E1FD6681', N'RS4 B7', 'audi-rs4-b7', @parentId_D31E1ADD9AF74033A19DB071E1FD6681, NULL, NULL, 37, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'audi-rs4-b8' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_D6162B3C533145F194E06959C6C9F943 uniqueidentifier
    SELECT @parentId_D6162B3C533145F194E06959C6C9F943 = Id FROM Categories WHERE Slug = 'audi' AND IsDeleted = 0
    IF @parentId_D6162B3C533145F194E06959C6C9F943 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('D6162B3C-5331-45F1-94E0-6959C6C9F943', N'RS4 B8', 'audi-rs4-b8', @parentId_D6162B3C533145F194E06959C6C9F943, NULL, NULL, 38, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'audi-rs6-c5' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_DE6480008FA94C75BEDFC08FA523C9FF uniqueidentifier
    SELECT @parentId_DE6480008FA94C75BEDFC08FA523C9FF = Id FROM Categories WHERE Slug = 'audi' AND IsDeleted = 0
    IF @parentId_DE6480008FA94C75BEDFC08FA523C9FF IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('DE648000-8FA9-4C75-BEDF-C08FA523C9FF', N'RS6 C5', 'audi-rs6-c5', @parentId_DE6480008FA94C75BEDFC08FA523C9FF, NULL, NULL, 39, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'audi-rs6-c7' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_FFC67B2D890B40428FFCEB44F6EB23DA uniqueidentifier
    SELECT @parentId_FFC67B2D890B40428FFCEB44F6EB23DA = Id FROM Categories WHERE Slug = 'audi' AND IsDeleted = 0
    IF @parentId_FFC67B2D890B40428FFCEB44F6EB23DA IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('FFC67B2D-890B-4042-8FFC-EB44F6EB23DA', N'RS6 C7', 'audi-rs6-c7', @parentId_FFC67B2D890B40428FFCEB44F6EB23DA, NULL, NULL, 40, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'audi-s3-8l' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_6EB6778E5BC346CCACA0F95C4BA6BE7F uniqueidentifier
    SELECT @parentId_6EB6778E5BC346CCACA0F95C4BA6BE7F = Id FROM Categories WHERE Slug = 'audi' AND IsDeleted = 0
    IF @parentId_6EB6778E5BC346CCACA0F95C4BA6BE7F IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('6EB6778E-5BC3-46CC-ACA0-F95C4BA6BE7F', N'S3 8L', 'audi-s3-8l', @parentId_6EB6778E5BC346CCACA0F95C4BA6BE7F, NULL, NULL, 41, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'audi-s3-8p' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_2D8F130C03A14D2AA73B447DB4809DDA uniqueidentifier
    SELECT @parentId_2D8F130C03A14D2AA73B447DB4809DDA = Id FROM Categories WHERE Slug = 'audi' AND IsDeleted = 0
    IF @parentId_2D8F130C03A14D2AA73B447DB4809DDA IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('2D8F130C-03A1-4D2A-A73B-447DB4809DDA', N'S3 8P', 'audi-s3-8p', @parentId_2D8F130C03A14D2AA73B447DB4809DDA, NULL, NULL, 42, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'audi-s4-b5' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_1E4BC19982F04DC494FF8DFDE0A5790D uniqueidentifier
    SELECT @parentId_1E4BC19982F04DC494FF8DFDE0A5790D = Id FROM Categories WHERE Slug = 'audi' AND IsDeleted = 0
    IF @parentId_1E4BC19982F04DC494FF8DFDE0A5790D IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('1E4BC199-82F0-4DC4-94FF-8DFDE0A5790D', N'S4 B5', 'audi-s4-b5', @parentId_1E4BC19982F04DC494FF8DFDE0A5790D, NULL, NULL, 43, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'audi-s4-b6' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_7B6210093E55427B8EADF7F6F456E5DB uniqueidentifier
    SELECT @parentId_7B6210093E55427B8EADF7F6F456E5DB = Id FROM Categories WHERE Slug = 'audi' AND IsDeleted = 0
    IF @parentId_7B6210093E55427B8EADF7F6F456E5DB IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('7B621009-3E55-427B-8EAD-F7F6F456E5DB', N'S4 B6', 'audi-s4-b6', @parentId_7B6210093E55427B8EADF7F6F456E5DB, NULL, NULL, 44, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'audi-s4-b8' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_6AB41F32B9BE474585E980A22C6AF43A uniqueidentifier
    SELECT @parentId_6AB41F32B9BE474585E980A22C6AF43A = Id FROM Categories WHERE Slug = 'audi' AND IsDeleted = 0
    IF @parentId_6AB41F32B9BE474585E980A22C6AF43A IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('6AB41F32-B9BE-4745-85E9-80A22C6AF43A', N'S4 B8', 'audi-s4-b8', @parentId_6AB41F32B9BE474585E980A22C6AF43A, NULL, NULL, 45, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'ford' AND IsDeleted = 0)
BEGIN
    INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
    VALUES ('FBD95807-D679-4BD5-BB3D-25CF1CA61B5C', N'Ford', 'ford', NULL, NULL, NULL, 6, 1, 1, 1, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
ELSE
BEGIN
    -- Varsa ShowInVehicleNav=true gÃ¼ncelle
    UPDATE Categories SET ShowInVehicleNav = 1 WHERE Slug = 'ford' AND IsDeleted = 0
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'ford-focus-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_474BC625A67A42F9B8EF7563A8CFD0EA uniqueidentifier
    SELECT @parentId_474BC625A67A42F9B8EF7563A8CFD0EA = Id FROM Categories WHERE Slug = 'ford' AND IsDeleted = 0
    IF @parentId_474BC625A67A42F9B8EF7563A8CFD0EA IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('474BC625-A67A-42F9-B8EF-7563A8CFD0EA', N'Focus I', 'ford-focus-i', @parentId_474BC625A67A42F9B8EF7563A8CFD0EA, NULL, NULL, 0, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'ford-focus-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_A41CAD0B6B85453F83E2055E1ADF493A uniqueidentifier
    SELECT @parentId_A41CAD0B6B85453F83E2055E1ADF493A = Id FROM Categories WHERE Slug = 'ford' AND IsDeleted = 0
    IF @parentId_A41CAD0B6B85453F83E2055E1ADF493A IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('A41CAD0B-6B85-453F-83E2-055E1ADF493A', N'Focus II', 'ford-focus-ii', @parentId_A41CAD0B6B85453F83E2055E1ADF493A, NULL, NULL, 1, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'ford-focus-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_55A178B5BF6A404AA4F265425CE45602 uniqueidentifier
    SELECT @parentId_55A178B5BF6A404AA4F265425CE45602 = Id FROM Categories WHERE Slug = 'ford' AND IsDeleted = 0
    IF @parentId_55A178B5BF6A404AA4F265425CE45602 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('55A178B5-BF6A-404A-A4F2-65425CE45602', N'Focus III', 'ford-focus-iii', @parentId_55A178B5BF6A404AA4F265425CE45602, NULL, NULL, 2, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'ford-focus-iv' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_07AC7632056C40719737C687657B0581 uniqueidentifier
    SELECT @parentId_07AC7632056C40719737C687657B0581 = Id FROM Categories WHERE Slug = 'ford' AND IsDeleted = 0
    IF @parentId_07AC7632056C40719737C687657B0581 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('07AC7632-056C-4071-9737-C687657B0581', N'Focus IV', 'ford-focus-iv', @parentId_07AC7632056C40719737C687657B0581, NULL, NULL, 3, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'ford-fiesta-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_38CF8FB2D6234D4D948C18C26F5702CD uniqueidentifier
    SELECT @parentId_38CF8FB2D6234D4D948C18C26F5702CD = Id FROM Categories WHERE Slug = 'ford' AND IsDeleted = 0
    IF @parentId_38CF8FB2D6234D4D948C18C26F5702CD IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('38CF8FB2-D623-4D4D-948C-18C26F5702CD', N'Fiesta III', 'ford-fiesta-iii', @parentId_38CF8FB2D6234D4D948C18C26F5702CD, NULL, NULL, 4, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'ford-fiesta-iv' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_EFF1D02F42B443F294C97184C0B7B6C7 uniqueidentifier
    SELECT @parentId_EFF1D02F42B443F294C97184C0B7B6C7 = Id FROM Categories WHERE Slug = 'ford' AND IsDeleted = 0
    IF @parentId_EFF1D02F42B443F294C97184C0B7B6C7 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('EFF1D02F-42B4-43F2-94C9-7184C0B7B6C7', N'Fiesta IV', 'ford-fiesta-iv', @parentId_EFF1D02F42B443F294C97184C0B7B6C7, NULL, NULL, 5, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'ford-fiesta-v' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_88EACBB3097744A29B028FA2659B874B uniqueidentifier
    SELECT @parentId_88EACBB3097744A29B028FA2659B874B = Id FROM Categories WHERE Slug = 'ford' AND IsDeleted = 0
    IF @parentId_88EACBB3097744A29B028FA2659B874B IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('88EACBB3-0977-44A2-9B02-8FA2659B874B', N'Fiesta V', 'ford-fiesta-v', @parentId_88EACBB3097744A29B028FA2659B874B, NULL, NULL, 6, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'ford-fiesta-vi' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_545F8F8126704F7B9BF74C63EF204D77 uniqueidentifier
    SELECT @parentId_545F8F8126704F7B9BF74C63EF204D77 = Id FROM Categories WHERE Slug = 'ford' AND IsDeleted = 0
    IF @parentId_545F8F8126704F7B9BF74C63EF204D77 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('545F8F81-2670-4F7B-9BF7-4C63EF204D77', N'Fiesta VI', 'ford-fiesta-vi', @parentId_545F8F8126704F7B9BF74C63EF204D77, NULL, NULL, 7, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'ford-fiesta-vii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_27F2A5570B334CD9A357EC3F59283C7A uniqueidentifier
    SELECT @parentId_27F2A5570B334CD9A357EC3F59283C7A = Id FROM Categories WHERE Slug = 'ford' AND IsDeleted = 0
    IF @parentId_27F2A5570B334CD9A357EC3F59283C7A IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('27F2A557-0B33-4CD9-A357-EC3F59283C7A', N'Fiesta VII', 'ford-fiesta-vii', @parentId_27F2A5570B334CD9A357EC3F59283C7A, NULL, NULL, 8, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'ford-mondeo-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_17E482D2C61D44EFB7CC7F6DD741CD52 uniqueidentifier
    SELECT @parentId_17E482D2C61D44EFB7CC7F6DD741CD52 = Id FROM Categories WHERE Slug = 'ford' AND IsDeleted = 0
    IF @parentId_17E482D2C61D44EFB7CC7F6DD741CD52 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('17E482D2-C61D-44EF-B7CC-7F6DD741CD52', N'Mondeo I', 'ford-mondeo-i', @parentId_17E482D2C61D44EFB7CC7F6DD741CD52, NULL, NULL, 9, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'ford-mondeo-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_7D52A57DEBC84830A5ABCA89D0E5F634 uniqueidentifier
    SELECT @parentId_7D52A57DEBC84830A5ABCA89D0E5F634 = Id FROM Categories WHERE Slug = 'ford' AND IsDeleted = 0
    IF @parentId_7D52A57DEBC84830A5ABCA89D0E5F634 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('7D52A57D-EBC8-4830-A5AB-CA89D0E5F634', N'Mondeo II', 'ford-mondeo-ii', @parentId_7D52A57DEBC84830A5ABCA89D0E5F634, NULL, NULL, 10, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'ford-mondeo-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_0437EB0DF6924D7080FC10A0803859C1 uniqueidentifier
    SELECT @parentId_0437EB0DF6924D7080FC10A0803859C1 = Id FROM Categories WHERE Slug = 'ford' AND IsDeleted = 0
    IF @parentId_0437EB0DF6924D7080FC10A0803859C1 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('0437EB0D-F692-4D70-80FC-10A0803859C1', N'Mondeo III', 'ford-mondeo-iii', @parentId_0437EB0DF6924D7080FC10A0803859C1, NULL, NULL, 11, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'ford-mondeo-iv' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_C9ED389299594B19B8597CC03CDB0D2D uniqueidentifier
    SELECT @parentId_C9ED389299594B19B8597CC03CDB0D2D = Id FROM Categories WHERE Slug = 'ford' AND IsDeleted = 0
    IF @parentId_C9ED389299594B19B8597CC03CDB0D2D IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('C9ED3892-9959-4B19-B859-7CC03CDB0D2D', N'Mondeo IV', 'ford-mondeo-iv', @parentId_C9ED389299594B19B8597CC03CDB0D2D, NULL, NULL, 12, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'ford-mondeo-v' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_F6269333A71A40C89E80169E168B8187 uniqueidentifier
    SELECT @parentId_F6269333A71A40C89E80169E168B8187 = Id FROM Categories WHERE Slug = 'ford' AND IsDeleted = 0
    IF @parentId_F6269333A71A40C89E80169E168B8187 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('F6269333-A71A-40C8-9E80-169E168B8187', N'Mondeo V', 'ford-mondeo-v', @parentId_F6269333A71A40C89E80169E168B8187, NULL, NULL, 13, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'ford-kuga-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_3E76AD661F5048979A911B1CEDA25509 uniqueidentifier
    SELECT @parentId_3E76AD661F5048979A911B1CEDA25509 = Id FROM Categories WHERE Slug = 'ford' AND IsDeleted = 0
    IF @parentId_3E76AD661F5048979A911B1CEDA25509 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('3E76AD66-1F50-4897-9A91-1B1CEDA25509', N'Kuga I', 'ford-kuga-i', @parentId_3E76AD661F5048979A911B1CEDA25509, NULL, NULL, 14, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'ford-kuga-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_71676CAED4CF432D888E9DCD1F24B788 uniqueidentifier
    SELECT @parentId_71676CAED4CF432D888E9DCD1F24B788 = Id FROM Categories WHERE Slug = 'ford' AND IsDeleted = 0
    IF @parentId_71676CAED4CF432D888E9DCD1F24B788 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('71676CAE-D4CF-432D-888E-9DCD1F24B788', N'Kuga II', 'ford-kuga-ii', @parentId_71676CAED4CF432D888E9DCD1F24B788, NULL, NULL, 15, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'ford-kuga-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_00394B1059AF437D81281C3452B58E97 uniqueidentifier
    SELECT @parentId_00394B1059AF437D81281C3452B58E97 = Id FROM Categories WHERE Slug = 'ford' AND IsDeleted = 0
    IF @parentId_00394B1059AF437D81281C3452B58E97 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('00394B10-59AF-437D-8128-1C3452B58E97', N'Kuga III', 'ford-kuga-iii', @parentId_00394B1059AF437D81281C3452B58E97, NULL, NULL, 16, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'ford-ecosport' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_908A73F1571C4ACEBDC4B8E1C89F9114 uniqueidentifier
    SELECT @parentId_908A73F1571C4ACEBDC4B8E1C89F9114 = Id FROM Categories WHERE Slug = 'ford' AND IsDeleted = 0
    IF @parentId_908A73F1571C4ACEBDC4B8E1C89F9114 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('908A73F1-571C-4ACE-BDC4-B8E1C89F9114', N'EcoSport', 'ford-ecosport', @parentId_908A73F1571C4ACEBDC4B8E1C89F9114, NULL, NULL, 17, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'ford-puma-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_7A0873060DE245CEB352172817B76817 uniqueidentifier
    SELECT @parentId_7A0873060DE245CEB352172817B76817 = Id FROM Categories WHERE Slug = 'ford' AND IsDeleted = 0
    IF @parentId_7A0873060DE245CEB352172817B76817 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('7A087306-0DE2-45CE-B352-172817B76817', N'Puma II', 'ford-puma-ii', @parentId_7A0873060DE245CEB352172817B76817, NULL, NULL, 18, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'ford-galaxy-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_5851C5D599DF4C8986F10EABCFB10F5B uniqueidentifier
    SELECT @parentId_5851C5D599DF4C8986F10EABCFB10F5B = Id FROM Categories WHERE Slug = 'ford' AND IsDeleted = 0
    IF @parentId_5851C5D599DF4C8986F10EABCFB10F5B IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('5851C5D5-99DF-4C89-86F1-0EABCFB10F5B', N'Galaxy I', 'ford-galaxy-i', @parentId_5851C5D599DF4C8986F10EABCFB10F5B, NULL, NULL, 19, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'ford-galaxy-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_703B8A6F8B1C4599B4266E1A63E089B0 uniqueidentifier
    SELECT @parentId_703B8A6F8B1C4599B4266E1A63E089B0 = Id FROM Categories WHERE Slug = 'ford' AND IsDeleted = 0
    IF @parentId_703B8A6F8B1C4599B4266E1A63E089B0 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('703B8A6F-8B1C-4599-B426-6E1A63E089B0', N'Galaxy II', 'ford-galaxy-ii', @parentId_703B8A6F8B1C4599B4266E1A63E089B0, NULL, NULL, 20, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'ford-galaxy-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_D86B7392E2CF4579915AACFE45055E82 uniqueidentifier
    SELECT @parentId_D86B7392E2CF4579915AACFE45055E82 = Id FROM Categories WHERE Slug = 'ford' AND IsDeleted = 0
    IF @parentId_D86B7392E2CF4579915AACFE45055E82 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('D86B7392-E2CF-4579-915A-ACFE45055E82', N'Galaxy III', 'ford-galaxy-iii', @parentId_D86B7392E2CF4579915AACFE45055E82, NULL, NULL, 21, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'ford-s-max-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_FB4BEE2024144C58908E32230093DCB8 uniqueidentifier
    SELECT @parentId_FB4BEE2024144C58908E32230093DCB8 = Id FROM Categories WHERE Slug = 'ford' AND IsDeleted = 0
    IF @parentId_FB4BEE2024144C58908E32230093DCB8 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('FB4BEE20-2414-4C58-908E-32230093DCB8', N'S-MAX I', 'ford-s-max-i', @parentId_FB4BEE2024144C58908E32230093DCB8, NULL, NULL, 22, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'ford-s-max-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_42EBD9BEFBA8403BAAF28A8272A97F67 uniqueidentifier
    SELECT @parentId_42EBD9BEFBA8403BAAF28A8272A97F67 = Id FROM Categories WHERE Slug = 'ford' AND IsDeleted = 0
    IF @parentId_42EBD9BEFBA8403BAAF28A8272A97F67 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('42EBD9BE-FBA8-403B-AAF2-8A8272A97F67', N'S-MAX II', 'ford-s-max-ii', @parentId_42EBD9BEFBA8403BAAF28A8272A97F67, NULL, NULL, 23, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'ford-transit-v184' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_0C8C85F2B0C64DDAAED4DD859E7D808D uniqueidentifier
    SELECT @parentId_0C8C85F2B0C64DDAAED4DD859E7D808D = Id FROM Categories WHERE Slug = 'ford' AND IsDeleted = 0
    IF @parentId_0C8C85F2B0C64DDAAED4DD859E7D808D IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('0C8C85F2-B0C6-4DDA-AED4-DD859E7D808D', N'Transit V184', 'ford-transit-v184', @parentId_0C8C85F2B0C64DDAAED4DD859E7D808D, NULL, NULL, 24, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'ford-transit-v347' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_CC08635C8993484E89FD50D901D11C94 uniqueidentifier
    SELECT @parentId_CC08635C8993484E89FD50D901D11C94 = Id FROM Categories WHERE Slug = 'ford' AND IsDeleted = 0
    IF @parentId_CC08635C8993484E89FD50D901D11C94 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('CC08635C-8993-484E-89FD-50D901D11C94', N'Transit V347', 'ford-transit-v347', @parentId_CC08635C8993484E89FD50D901D11C94, NULL, NULL, 25, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'ford-transit-v363' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_D5BCECA975B94AAAB2693034CA37B1D2 uniqueidentifier
    SELECT @parentId_D5BCECA975B94AAAB2693034CA37B1D2 = Id FROM Categories WHERE Slug = 'ford' AND IsDeleted = 0
    IF @parentId_D5BCECA975B94AAAB2693034CA37B1D2 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('D5BCECA9-75B9-4AAA-B269-3034CA37B1D2', N'Transit V363', 'ford-transit-v363', @parentId_D5BCECA975B94AAAB2693034CA37B1D2, NULL, NULL, 26, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'ford-tourneo-connect' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_BBCD4FA571324061A37C7541954FBBF5 uniqueidentifier
    SELECT @parentId_BBCD4FA571324061A37C7541954FBBF5 = Id FROM Categories WHERE Slug = 'ford' AND IsDeleted = 0
    IF @parentId_BBCD4FA571324061A37C7541954FBBF5 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('BBCD4FA5-7132-4061-A37C-7541954FBBF5', N'Tourneo Connect', 'ford-tourneo-connect', @parentId_BBCD4FA571324061A37C7541954FBBF5, NULL, NULL, 27, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'ford-tourneo-custom' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_185835497C8F4B2489433050897F38E2 uniqueidentifier
    SELECT @parentId_185835497C8F4B2489433050897F38E2 = Id FROM Categories WHERE Slug = 'ford' AND IsDeleted = 0
    IF @parentId_185835497C8F4B2489433050897F38E2 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('18583549-7C8F-4B24-8943-3050897F38E2', N'Tourneo Custom', 'ford-tourneo-custom', @parentId_185835497C8F4B2489433050897F38E2, NULL, NULL, 28, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'ford-ranger-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_1173D33FF47E4A68A89316CEDB632A16 uniqueidentifier
    SELECT @parentId_1173D33FF47E4A68A89316CEDB632A16 = Id FROM Categories WHERE Slug = 'ford' AND IsDeleted = 0
    IF @parentId_1173D33FF47E4A68A89316CEDB632A16 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('1173D33F-F47E-4A68-A893-16CEDB632A16', N'Ranger III', 'ford-ranger-iii', @parentId_1173D33FF47E4A68A89316CEDB632A16, NULL, NULL, 29, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'ford-ranger-iv' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_1086FA90111946A19A8231C2379009CE uniqueidentifier
    SELECT @parentId_1086FA90111946A19A8231C2379009CE = Id FROM Categories WHERE Slug = 'ford' AND IsDeleted = 0
    IF @parentId_1086FA90111946A19A8231C2379009CE IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('1086FA90-1119-46A1-9A82-31C2379009CE', N'Ranger IV', 'ford-ranger-iv', @parentId_1086FA90111946A19A8231C2379009CE, NULL, NULL, 30, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'ford-mustang-v' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_44C50B21386E49AA8B8804E663009D88 uniqueidentifier
    SELECT @parentId_44C50B21386E49AA8B8804E663009D88 = Id FROM Categories WHERE Slug = 'ford' AND IsDeleted = 0
    IF @parentId_44C50B21386E49AA8B8804E663009D88 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('44C50B21-386E-49AA-8B88-04E663009D88', N'Mustang V', 'ford-mustang-v', @parentId_44C50B21386E49AA8B8804E663009D88, NULL, NULL, 31, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'ford-mustang-vi' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_E2ABAACB2963488A877683FB4B0CF76E uniqueidentifier
    SELECT @parentId_E2ABAACB2963488A877683FB4B0CF76E = Id FROM Categories WHERE Slug = 'ford' AND IsDeleted = 0
    IF @parentId_E2ABAACB2963488A877683FB4B0CF76E IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('E2ABAACB-2963-488A-8776-83FB4B0CF76E', N'Mustang VI', 'ford-mustang-vi', @parentId_E2ABAACB2963488A877683FB4B0CF76E, NULL, NULL, 32, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'seat' AND IsDeleted = 0)
BEGIN
    INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
    VALUES ('ED90D152-05BB-479A-A8B7-11418C335434', N'Seat', 'seat', NULL, NULL, NULL, 7, 1, 1, 1, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
ELSE
BEGIN
    -- Varsa ShowInVehicleNav=true gÃ¼ncelle
    UPDATE Categories SET ShowInVehicleNav = 1 WHERE Slug = 'seat' AND IsDeleted = 0
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'seat-ibiza-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_28444FE1C1774507AB816F6F87BF6DD8 uniqueidentifier
    SELECT @parentId_28444FE1C1774507AB816F6F87BF6DD8 = Id FROM Categories WHERE Slug = 'seat' AND IsDeleted = 0
    IF @parentId_28444FE1C1774507AB816F6F87BF6DD8 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('28444FE1-C177-4507-AB81-6F6F87BF6DD8', N'Ibiza I', 'seat-ibiza-i', @parentId_28444FE1C1774507AB816F6F87BF6DD8, NULL, NULL, 0, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'seat-ibiza-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_CACF900312EE4184840F78AAE46C6ECD uniqueidentifier
    SELECT @parentId_CACF900312EE4184840F78AAE46C6ECD = Id FROM Categories WHERE Slug = 'seat' AND IsDeleted = 0
    IF @parentId_CACF900312EE4184840F78AAE46C6ECD IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('CACF9003-12EE-4184-840F-78AAE46C6ECD', N'Ibiza II', 'seat-ibiza-ii', @parentId_CACF900312EE4184840F78AAE46C6ECD, NULL, NULL, 1, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'seat-ibiza-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_3C7D380BBC9A452E97420C05ACD95FFD uniqueidentifier
    SELECT @parentId_3C7D380BBC9A452E97420C05ACD95FFD = Id FROM Categories WHERE Slug = 'seat' AND IsDeleted = 0
    IF @parentId_3C7D380BBC9A452E97420C05ACD95FFD IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('3C7D380B-BC9A-452E-9742-0C05ACD95FFD', N'Ibiza III', 'seat-ibiza-iii', @parentId_3C7D380BBC9A452E97420C05ACD95FFD, NULL, NULL, 2, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'seat-ibiza-iv' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_862E50CC50A0407A8A965C1F7FC015E2 uniqueidentifier
    SELECT @parentId_862E50CC50A0407A8A965C1F7FC015E2 = Id FROM Categories WHERE Slug = 'seat' AND IsDeleted = 0
    IF @parentId_862E50CC50A0407A8A965C1F7FC015E2 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('862E50CC-50A0-407A-8A96-5C1F7FC015E2', N'Ibiza IV', 'seat-ibiza-iv', @parentId_862E50CC50A0407A8A965C1F7FC015E2, NULL, NULL, 3, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'seat-ibiza-v' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_11CF1D9C39F74D88B4C5FD4A61C385F9 uniqueidentifier
    SELECT @parentId_11CF1D9C39F74D88B4C5FD4A61C385F9 = Id FROM Categories WHERE Slug = 'seat' AND IsDeleted = 0
    IF @parentId_11CF1D9C39F74D88B4C5FD4A61C385F9 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('11CF1D9C-39F7-4D88-B4C5-FD4A61C385F9', N'Ibiza V', 'seat-ibiza-v', @parentId_11CF1D9C39F74D88B4C5FD4A61C385F9, NULL, NULL, 4, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'seat-leon-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_245E6D28981A4692A987F5F9A40CB664 uniqueidentifier
    SELECT @parentId_245E6D28981A4692A987F5F9A40CB664 = Id FROM Categories WHERE Slug = 'seat' AND IsDeleted = 0
    IF @parentId_245E6D28981A4692A987F5F9A40CB664 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('245E6D28-981A-4692-A987-F5F9A40CB664', N'Leon I', 'seat-leon-i', @parentId_245E6D28981A4692A987F5F9A40CB664, NULL, NULL, 5, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'seat-leon-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_F67A6C6FA9474DDA9DBE9B5E87F6FB8B uniqueidentifier
    SELECT @parentId_F67A6C6FA9474DDA9DBE9B5E87F6FB8B = Id FROM Categories WHERE Slug = 'seat' AND IsDeleted = 0
    IF @parentId_F67A6C6FA9474DDA9DBE9B5E87F6FB8B IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('F67A6C6F-A947-4DDA-9DBE-9B5E87F6FB8B', N'Leon II', 'seat-leon-ii', @parentId_F67A6C6FA9474DDA9DBE9B5E87F6FB8B, NULL, NULL, 6, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'seat-leon-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_5BD697CB00264B7F9225A05121667143 uniqueidentifier
    SELECT @parentId_5BD697CB00264B7F9225A05121667143 = Id FROM Categories WHERE Slug = 'seat' AND IsDeleted = 0
    IF @parentId_5BD697CB00264B7F9225A05121667143 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('5BD697CB-0026-4B7F-9225-A05121667143', N'Leon III', 'seat-leon-iii', @parentId_5BD697CB00264B7F9225A05121667143, NULL, NULL, 7, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'seat-leon-iv' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_090EC319BB3F48E08F48E38547BD0BD4 uniqueidentifier
    SELECT @parentId_090EC319BB3F48E08F48E38547BD0BD4 = Id FROM Categories WHERE Slug = 'seat' AND IsDeleted = 0
    IF @parentId_090EC319BB3F48E08F48E38547BD0BD4 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('090EC319-BB3F-48E0-8F48-E38547BD0BD4', N'Leon IV', 'seat-leon-iv', @parentId_090EC319BB3F48E08F48E38547BD0BD4, NULL, NULL, 8, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'seat-toledo-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_D8501CB4821B4893B8B49444F24F7169 uniqueidentifier
    SELECT @parentId_D8501CB4821B4893B8B49444F24F7169 = Id FROM Categories WHERE Slug = 'seat' AND IsDeleted = 0
    IF @parentId_D8501CB4821B4893B8B49444F24F7169 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('D8501CB4-821B-4893-B8B4-9444F24F7169', N'Toledo I', 'seat-toledo-i', @parentId_D8501CB4821B4893B8B49444F24F7169, NULL, NULL, 9, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'seat-toledo-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_487DD18620214090BF8CF632E04E6055 uniqueidentifier
    SELECT @parentId_487DD18620214090BF8CF632E04E6055 = Id FROM Categories WHERE Slug = 'seat' AND IsDeleted = 0
    IF @parentId_487DD18620214090BF8CF632E04E6055 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('487DD186-2021-4090-BF8C-F632E04E6055', N'Toledo II', 'seat-toledo-ii', @parentId_487DD18620214090BF8CF632E04E6055, NULL, NULL, 10, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'seat-toledo-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_410FF3EB0AA34ADD8EE14FE08FA73F4A uniqueidentifier
    SELECT @parentId_410FF3EB0AA34ADD8EE14FE08FA73F4A = Id FROM Categories WHERE Slug = 'seat' AND IsDeleted = 0
    IF @parentId_410FF3EB0AA34ADD8EE14FE08FA73F4A IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('410FF3EB-0AA3-4ADD-8EE1-4FE08FA73F4A', N'Toledo III', 'seat-toledo-iii', @parentId_410FF3EB0AA34ADD8EE14FE08FA73F4A, NULL, NULL, 11, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'seat-toledo-iv' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_F9B50D1F4BD743E3B6CBEAE7ADB87ACD uniqueidentifier
    SELECT @parentId_F9B50D1F4BD743E3B6CBEAE7ADB87ACD = Id FROM Categories WHERE Slug = 'seat' AND IsDeleted = 0
    IF @parentId_F9B50D1F4BD743E3B6CBEAE7ADB87ACD IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('F9B50D1F-4BD7-43E3-B6CB-EAE7ADB87ACD', N'Toledo IV', 'seat-toledo-iv', @parentId_F9B50D1F4BD743E3B6CBEAE7ADB87ACD, NULL, NULL, 12, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'seat-ateca' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_BBDD3FB8C8FD49B09CF22BDD748AB460 uniqueidentifier
    SELECT @parentId_BBDD3FB8C8FD49B09CF22BDD748AB460 = Id FROM Categories WHERE Slug = 'seat' AND IsDeleted = 0
    IF @parentId_BBDD3FB8C8FD49B09CF22BDD748AB460 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('BBDD3FB8-C8FD-49B0-9CF2-2BDD748AB460', N'Ateca', 'seat-ateca', @parentId_BBDD3FB8C8FD49B09CF22BDD748AB460, NULL, NULL, 13, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'seat-arona' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_D8EB1737D6A84628B24720418C6AC844 uniqueidentifier
    SELECT @parentId_D8EB1737D6A84628B24720418C6AC844 = Id FROM Categories WHERE Slug = 'seat' AND IsDeleted = 0
    IF @parentId_D8EB1737D6A84628B24720418C6AC844 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('D8EB1737-D6A8-4628-B247-20418C6AC844', N'Arona', 'seat-arona', @parentId_D8EB1737D6A84628B24720418C6AC844, NULL, NULL, 14, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'seat-tarraco' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_D3D9DB6611F74516AE5709A408CDB025 uniqueidentifier
    SELECT @parentId_D3D9DB6611F74516AE5709A408CDB025 = Id FROM Categories WHERE Slug = 'seat' AND IsDeleted = 0
    IF @parentId_D3D9DB6611F74516AE5709A408CDB025 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('D3D9DB66-11F7-4516-AE57-09A408CDB025', N'Tarraco', 'seat-tarraco', @parentId_D3D9DB6611F74516AE5709A408CDB025, NULL, NULL, 15, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'seat-altea' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_03D1021200744A8FA8A60C2FD42E5A61 uniqueidentifier
    SELECT @parentId_03D1021200744A8FA8A60C2FD42E5A61 = Id FROM Categories WHERE Slug = 'seat' AND IsDeleted = 0
    IF @parentId_03D1021200744A8FA8A60C2FD42E5A61 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('03D10212-0074-4A8F-A8A6-0C2FD42E5A61', N'Altea', 'seat-altea', @parentId_03D1021200744A8FA8A60C2FD42E5A61, NULL, NULL, 16, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'seat-alhambra-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_0BFF44AB94AD4D7596B9CF1586B219D2 uniqueidentifier
    SELECT @parentId_0BFF44AB94AD4D7596B9CF1586B219D2 = Id FROM Categories WHERE Slug = 'seat' AND IsDeleted = 0
    IF @parentId_0BFF44AB94AD4D7596B9CF1586B219D2 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('0BFF44AB-94AD-4D75-96B9-CF1586B219D2', N'Alhambra II', 'seat-alhambra-ii', @parentId_0BFF44AB94AD4D7596B9CF1586B219D2, NULL, NULL, 17, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'skoda' AND IsDeleted = 0)
BEGIN
    INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
    VALUES ('17D05539-8839-4234-A18D-B8DE15EF3E63', N'Skoda', 'skoda', NULL, NULL, NULL, 8, 1, 1, 1, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
ELSE
BEGIN
    -- Varsa ShowInVehicleNav=true gÃ¼ncelle
    UPDATE Categories SET ShowInVehicleNav = 1 WHERE Slug = 'skoda' AND IsDeleted = 0
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'skoda-fabia-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_2ABB7CF0FECF45DF973376BB952E7D8D uniqueidentifier
    SELECT @parentId_2ABB7CF0FECF45DF973376BB952E7D8D = Id FROM Categories WHERE Slug = 'skoda' AND IsDeleted = 0
    IF @parentId_2ABB7CF0FECF45DF973376BB952E7D8D IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('2ABB7CF0-FECF-45DF-9733-76BB952E7D8D', N'Fabia I', 'skoda-fabia-i', @parentId_2ABB7CF0FECF45DF973376BB952E7D8D, NULL, NULL, 0, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'skoda-fabia-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_A89B72173AD741CFACECDDE6F2B0135A uniqueidentifier
    SELECT @parentId_A89B72173AD741CFACECDDE6F2B0135A = Id FROM Categories WHERE Slug = 'skoda' AND IsDeleted = 0
    IF @parentId_A89B72173AD741CFACECDDE6F2B0135A IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('A89B7217-3AD7-41CF-ACEC-DDE6F2B0135A', N'Fabia II', 'skoda-fabia-ii', @parentId_A89B72173AD741CFACECDDE6F2B0135A, NULL, NULL, 1, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'skoda-fabia-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_F9DBDC129DC448969C7AFEF6A2FE83C0 uniqueidentifier
    SELECT @parentId_F9DBDC129DC448969C7AFEF6A2FE83C0 = Id FROM Categories WHERE Slug = 'skoda' AND IsDeleted = 0
    IF @parentId_F9DBDC129DC448969C7AFEF6A2FE83C0 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('F9DBDC12-9DC4-4896-9C7A-FEF6A2FE83C0', N'Fabia III', 'skoda-fabia-iii', @parentId_F9DBDC129DC448969C7AFEF6A2FE83C0, NULL, NULL, 2, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'skoda-octavia-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_8C0EA1FC3CEF4ADAB8A6963660C02E81 uniqueidentifier
    SELECT @parentId_8C0EA1FC3CEF4ADAB8A6963660C02E81 = Id FROM Categories WHERE Slug = 'skoda' AND IsDeleted = 0
    IF @parentId_8C0EA1FC3CEF4ADAB8A6963660C02E81 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('8C0EA1FC-3CEF-4ADA-B8A6-963660C02E81', N'Octavia I', 'skoda-octavia-i', @parentId_8C0EA1FC3CEF4ADAB8A6963660C02E81, NULL, NULL, 3, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'skoda-octavia-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_8FD271BE958B4728854646151943DD1F uniqueidentifier
    SELECT @parentId_8FD271BE958B4728854646151943DD1F = Id FROM Categories WHERE Slug = 'skoda' AND IsDeleted = 0
    IF @parentId_8FD271BE958B4728854646151943DD1F IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('8FD271BE-958B-4728-8546-46151943DD1F', N'Octavia II', 'skoda-octavia-ii', @parentId_8FD271BE958B4728854646151943DD1F, NULL, NULL, 4, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'skoda-octavia-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_2118666B8F0A4DB093CFA26CEC02BB69 uniqueidentifier
    SELECT @parentId_2118666B8F0A4DB093CFA26CEC02BB69 = Id FROM Categories WHERE Slug = 'skoda' AND IsDeleted = 0
    IF @parentId_2118666B8F0A4DB093CFA26CEC02BB69 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('2118666B-8F0A-4DB0-93CF-A26CEC02BB69', N'Octavia III', 'skoda-octavia-iii', @parentId_2118666B8F0A4DB093CFA26CEC02BB69, NULL, NULL, 5, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'skoda-octavia-iv' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_8D37BE24FA054CD38EA5497C1B17429F uniqueidentifier
    SELECT @parentId_8D37BE24FA054CD38EA5497C1B17429F = Id FROM Categories WHERE Slug = 'skoda' AND IsDeleted = 0
    IF @parentId_8D37BE24FA054CD38EA5497C1B17429F IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('8D37BE24-FA05-4CD3-8EA5-497C1B17429F', N'Octavia IV', 'skoda-octavia-iv', @parentId_8D37BE24FA054CD38EA5497C1B17429F, NULL, NULL, 6, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'skoda-superb-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_53F9B45D93174C9A9D1E4511E14311EF uniqueidentifier
    SELECT @parentId_53F9B45D93174C9A9D1E4511E14311EF = Id FROM Categories WHERE Slug = 'skoda' AND IsDeleted = 0
    IF @parentId_53F9B45D93174C9A9D1E4511E14311EF IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('53F9B45D-9317-4C9A-9D1E-4511E14311EF', N'Superb I', 'skoda-superb-i', @parentId_53F9B45D93174C9A9D1E4511E14311EF, NULL, NULL, 7, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'skoda-superb-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_EA8CA914864A4E28A9EEDDEFE47D4E7F uniqueidentifier
    SELECT @parentId_EA8CA914864A4E28A9EEDDEFE47D4E7F = Id FROM Categories WHERE Slug = 'skoda' AND IsDeleted = 0
    IF @parentId_EA8CA914864A4E28A9EEDDEFE47D4E7F IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('EA8CA914-864A-4E28-A9EE-DDEFE47D4E7F', N'Superb II', 'skoda-superb-ii', @parentId_EA8CA914864A4E28A9EEDDEFE47D4E7F, NULL, NULL, 8, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'skoda-superb-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_6B42E972F30F4D40A1307B1FE8F2D2F0 uniqueidentifier
    SELECT @parentId_6B42E972F30F4D40A1307B1FE8F2D2F0 = Id FROM Categories WHERE Slug = 'skoda' AND IsDeleted = 0
    IF @parentId_6B42E972F30F4D40A1307B1FE8F2D2F0 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('6B42E972-F30F-4D40-A130-7B1FE8F2D2F0', N'Superb III', 'skoda-superb-iii', @parentId_6B42E972F30F4D40A1307B1FE8F2D2F0, NULL, NULL, 9, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'skoda-yeti' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_70FEE9CC279F4C53AA42938DED6B48E3 uniqueidentifier
    SELECT @parentId_70FEE9CC279F4C53AA42938DED6B48E3 = Id FROM Categories WHERE Slug = 'skoda' AND IsDeleted = 0
    IF @parentId_70FEE9CC279F4C53AA42938DED6B48E3 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('70FEE9CC-279F-4C53-AA42-938DED6B48E3', N'Yeti', 'skoda-yeti', @parentId_70FEE9CC279F4C53AA42938DED6B48E3, NULL, NULL, 10, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'skoda-kamiq' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_67F1624BC74A43FAB79106194361762D uniqueidentifier
    SELECT @parentId_67F1624BC74A43FAB79106194361762D = Id FROM Categories WHERE Slug = 'skoda' AND IsDeleted = 0
    IF @parentId_67F1624BC74A43FAB79106194361762D IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('67F1624B-C74A-43FA-B791-06194361762D', N'Kamiq', 'skoda-kamiq', @parentId_67F1624BC74A43FAB79106194361762D, NULL, NULL, 11, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'skoda-karoq' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_1D8188B14C994DE7858E664A8E1F995D uniqueidentifier
    SELECT @parentId_1D8188B14C994DE7858E664A8E1F995D = Id FROM Categories WHERE Slug = 'skoda' AND IsDeleted = 0
    IF @parentId_1D8188B14C994DE7858E664A8E1F995D IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('1D8188B1-4C99-4DE7-858E-664A8E1F995D', N'Karoq', 'skoda-karoq', @parentId_1D8188B14C994DE7858E664A8E1F995D, NULL, NULL, 12, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'skoda-kodiaq' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_ADC5430F41D049D0862BB375ED030860 uniqueidentifier
    SELECT @parentId_ADC5430F41D049D0862BB375ED030860 = Id FROM Categories WHERE Slug = 'skoda' AND IsDeleted = 0
    IF @parentId_ADC5430F41D049D0862BB375ED030860 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('ADC5430F-41D0-49D0-862B-B375ED030860', N'Kodiaq', 'skoda-kodiaq', @parentId_ADC5430F41D049D0862BB375ED030860, NULL, NULL, 13, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'skoda-rapid' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_5B2B364A2EAB44419FEC5322FF67F6FD uniqueidentifier
    SELECT @parentId_5B2B364A2EAB44419FEC5322FF67F6FD = Id FROM Categories WHERE Slug = 'skoda' AND IsDeleted = 0
    IF @parentId_5B2B364A2EAB44419FEC5322FF67F6FD IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('5B2B364A-2EAB-4441-9FEC-5322FF67F6FD', N'Rapid', 'skoda-rapid', @parentId_5B2B364A2EAB44419FEC5322FF67F6FD, NULL, NULL, 14, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'skoda-scala' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_CDA679A6FCC9444DBF9DBA978E5A73D7 uniqueidentifier
    SELECT @parentId_CDA679A6FCC9444DBF9DBA978E5A73D7 = Id FROM Categories WHERE Slug = 'skoda' AND IsDeleted = 0
    IF @parentId_CDA679A6FCC9444DBF9DBA978E5A73D7 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('CDA679A6-FCC9-444D-BF9D-BA978E5A73D7', N'Scala', 'skoda-scala', @parentId_CDA679A6FCC9444DBF9DBA978E5A73D7, NULL, NULL, 15, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'skoda-enyaq' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_1D369F03E463436AAC30F53306A07269 uniqueidentifier
    SELECT @parentId_1D369F03E463436AAC30F53306A07269 = Id FROM Categories WHERE Slug = 'skoda' AND IsDeleted = 0
    IF @parentId_1D369F03E463436AAC30F53306A07269 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('1D369F03-E463-436A-AC30-F53306A07269', N'Enyaq', 'skoda-enyaq', @parentId_1D369F03E463436AAC30F53306A07269, NULL, NULL, 16, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'renault' AND IsDeleted = 0)
BEGIN
    INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
    VALUES ('86F3C093-4F2D-4C5B-8C9D-9148BAF2A0FA', N'Renault', 'renault', NULL, NULL, NULL, 9, 1, 1, 1, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
ELSE
BEGIN
    -- Varsa ShowInVehicleNav=true gÃ¼ncelle
    UPDATE Categories SET ShowInVehicleNav = 1 WHERE Slug = 'renault' AND IsDeleted = 0
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'renault-clio-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_EB7D486E411D4472B8FCED114FC10CDD uniqueidentifier
    SELECT @parentId_EB7D486E411D4472B8FCED114FC10CDD = Id FROM Categories WHERE Slug = 'renault' AND IsDeleted = 0
    IF @parentId_EB7D486E411D4472B8FCED114FC10CDD IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('EB7D486E-411D-4472-B8FC-ED114FC10CDD', N'Clio I', 'renault-clio-i', @parentId_EB7D486E411D4472B8FCED114FC10CDD, NULL, NULL, 0, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'renault-clio-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_31D4059EFC434A1CAFAC993FCF517267 uniqueidentifier
    SELECT @parentId_31D4059EFC434A1CAFAC993FCF517267 = Id FROM Categories WHERE Slug = 'renault' AND IsDeleted = 0
    IF @parentId_31D4059EFC434A1CAFAC993FCF517267 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('31D4059E-FC43-4A1C-AFAC-993FCF517267', N'Clio II', 'renault-clio-ii', @parentId_31D4059EFC434A1CAFAC993FCF517267, NULL, NULL, 1, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'renault-clio-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_E5F99A98A7104ABC8F9F5585D25F2F01 uniqueidentifier
    SELECT @parentId_E5F99A98A7104ABC8F9F5585D25F2F01 = Id FROM Categories WHERE Slug = 'renault' AND IsDeleted = 0
    IF @parentId_E5F99A98A7104ABC8F9F5585D25F2F01 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('E5F99A98-A710-4ABC-8F9F-5585D25F2F01', N'Clio III', 'renault-clio-iii', @parentId_E5F99A98A7104ABC8F9F5585D25F2F01, NULL, NULL, 2, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'renault-clio-iv' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_53DF2160588B49AFAC21C4ECD872C7F3 uniqueidentifier
    SELECT @parentId_53DF2160588B49AFAC21C4ECD872C7F3 = Id FROM Categories WHERE Slug = 'renault' AND IsDeleted = 0
    IF @parentId_53DF2160588B49AFAC21C4ECD872C7F3 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('53DF2160-588B-49AF-AC21-C4ECD872C7F3', N'Clio IV', 'renault-clio-iv', @parentId_53DF2160588B49AFAC21C4ECD872C7F3, NULL, NULL, 3, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'renault-clio-v' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_8E2A7BCB7E234AE8B246121752358B7E uniqueidentifier
    SELECT @parentId_8E2A7BCB7E234AE8B246121752358B7E = Id FROM Categories WHERE Slug = 'renault' AND IsDeleted = 0
    IF @parentId_8E2A7BCB7E234AE8B246121752358B7E IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('8E2A7BCB-7E23-4AE8-B246-121752358B7E', N'Clio V', 'renault-clio-v', @parentId_8E2A7BCB7E234AE8B246121752358B7E, NULL, NULL, 4, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'renault-megane-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_5983141079604501BE682FCE254E0AFA uniqueidentifier
    SELECT @parentId_5983141079604501BE682FCE254E0AFA = Id FROM Categories WHERE Slug = 'renault' AND IsDeleted = 0
    IF @parentId_5983141079604501BE682FCE254E0AFA IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('59831410-7960-4501-BE68-2FCE254E0AFA', N'Megane I', 'renault-megane-i', @parentId_5983141079604501BE682FCE254E0AFA, NULL, NULL, 5, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'renault-megane-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_57D40EB1E6394351865BD9ED679728C9 uniqueidentifier
    SELECT @parentId_57D40EB1E6394351865BD9ED679728C9 = Id FROM Categories WHERE Slug = 'renault' AND IsDeleted = 0
    IF @parentId_57D40EB1E6394351865BD9ED679728C9 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('57D40EB1-E639-4351-865B-D9ED679728C9', N'Megane II', 'renault-megane-ii', @parentId_57D40EB1E6394351865BD9ED679728C9, NULL, NULL, 6, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'renault-megane-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_87A72668FA3B4B88941010E60D6A3F82 uniqueidentifier
    SELECT @parentId_87A72668FA3B4B88941010E60D6A3F82 = Id FROM Categories WHERE Slug = 'renault' AND IsDeleted = 0
    IF @parentId_87A72668FA3B4B88941010E60D6A3F82 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('87A72668-FA3B-4B88-9410-10E60D6A3F82', N'Megane III', 'renault-megane-iii', @parentId_87A72668FA3B4B88941010E60D6A3F82, NULL, NULL, 7, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'renault-megane-iv' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_9504CD5A19B8475E80A9BF1269D7BF8D uniqueidentifier
    SELECT @parentId_9504CD5A19B8475E80A9BF1269D7BF8D = Id FROM Categories WHERE Slug = 'renault' AND IsDeleted = 0
    IF @parentId_9504CD5A19B8475E80A9BF1269D7BF8D IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('9504CD5A-19B8-475E-80A9-BF1269D7BF8D', N'Megane IV', 'renault-megane-iv', @parentId_9504CD5A19B8475E80A9BF1269D7BF8D, NULL, NULL, 8, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'renault-laguna-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_4A9A422160204B478045CADF1E2A63E4 uniqueidentifier
    SELECT @parentId_4A9A422160204B478045CADF1E2A63E4 = Id FROM Categories WHERE Slug = 'renault' AND IsDeleted = 0
    IF @parentId_4A9A422160204B478045CADF1E2A63E4 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('4A9A4221-6020-4B47-8045-CADF1E2A63E4', N'Laguna I', 'renault-laguna-i', @parentId_4A9A422160204B478045CADF1E2A63E4, NULL, NULL, 9, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'renault-laguna-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_6B703AB3DCB04CF1A9F1233EBE621645 uniqueidentifier
    SELECT @parentId_6B703AB3DCB04CF1A9F1233EBE621645 = Id FROM Categories WHERE Slug = 'renault' AND IsDeleted = 0
    IF @parentId_6B703AB3DCB04CF1A9F1233EBE621645 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('6B703AB3-DCB0-4CF1-A9F1-233EBE621645', N'Laguna II', 'renault-laguna-ii', @parentId_6B703AB3DCB04CF1A9F1233EBE621645, NULL, NULL, 10, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'renault-laguna-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_6C5CEBD9FE424D4CAD31C24679AAFC29 uniqueidentifier
    SELECT @parentId_6C5CEBD9FE424D4CAD31C24679AAFC29 = Id FROM Categories WHERE Slug = 'renault' AND IsDeleted = 0
    IF @parentId_6C5CEBD9FE424D4CAD31C24679AAFC29 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('6C5CEBD9-FE42-4D4C-AD31-C24679AAFC29', N'Laguna III', 'renault-laguna-iii', @parentId_6C5CEBD9FE424D4CAD31C24679AAFC29, NULL, NULL, 11, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'renault-scenic-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_D0C3C7EDBD804BF088E7C8946B584298 uniqueidentifier
    SELECT @parentId_D0C3C7EDBD804BF088E7C8946B584298 = Id FROM Categories WHERE Slug = 'renault' AND IsDeleted = 0
    IF @parentId_D0C3C7EDBD804BF088E7C8946B584298 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('D0C3C7ED-BD80-4BF0-88E7-C8946B584298', N'Scenic I', 'renault-scenic-i', @parentId_D0C3C7EDBD804BF088E7C8946B584298, NULL, NULL, 12, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'renault-scenic-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_E55F94B947164FFE85AC42CAF65229A8 uniqueidentifier
    SELECT @parentId_E55F94B947164FFE85AC42CAF65229A8 = Id FROM Categories WHERE Slug = 'renault' AND IsDeleted = 0
    IF @parentId_E55F94B947164FFE85AC42CAF65229A8 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('E55F94B9-4716-4FFE-85AC-42CAF65229A8', N'Scenic II', 'renault-scenic-ii', @parentId_E55F94B947164FFE85AC42CAF65229A8, NULL, NULL, 13, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'renault-scenic-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_1228DDDFECAC4A998C9E1F8F7631ABD3 uniqueidentifier
    SELECT @parentId_1228DDDFECAC4A998C9E1F8F7631ABD3 = Id FROM Categories WHERE Slug = 'renault' AND IsDeleted = 0
    IF @parentId_1228DDDFECAC4A998C9E1F8F7631ABD3 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('1228DDDF-ECAC-4A99-8C9E-1F8F7631ABD3', N'Scenic III', 'renault-scenic-iii', @parentId_1228DDDFECAC4A998C9E1F8F7631ABD3, NULL, NULL, 14, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'renault-kadjar' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_53C6B4B5D07145B98D64FAB86F3581C0 uniqueidentifier
    SELECT @parentId_53C6B4B5D07145B98D64FAB86F3581C0 = Id FROM Categories WHERE Slug = 'renault' AND IsDeleted = 0
    IF @parentId_53C6B4B5D07145B98D64FAB86F3581C0 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('53C6B4B5-D071-45B9-8D64-FAB86F3581C0', N'Kadjar', 'renault-kadjar', @parentId_53C6B4B5D07145B98D64FAB86F3581C0, NULL, NULL, 15, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'renault-captur-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_96F691105FC844C1A6CC961A45F36B62 uniqueidentifier
    SELECT @parentId_96F691105FC844C1A6CC961A45F36B62 = Id FROM Categories WHERE Slug = 'renault' AND IsDeleted = 0
    IF @parentId_96F691105FC844C1A6CC961A45F36B62 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('96F69110-5FC8-44C1-A6CC-961A45F36B62', N'Captur I', 'renault-captur-i', @parentId_96F691105FC844C1A6CC961A45F36B62, NULL, NULL, 16, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'renault-captur-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_557A56ECB0E74B1D88CFE02800BE0F87 uniqueidentifier
    SELECT @parentId_557A56ECB0E74B1D88CFE02800BE0F87 = Id FROM Categories WHERE Slug = 'renault' AND IsDeleted = 0
    IF @parentId_557A56ECB0E74B1D88CFE02800BE0F87 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('557A56EC-B0E7-4B1D-88CF-E02800BE0F87', N'Captur II', 'renault-captur-ii', @parentId_557A56ECB0E74B1D88CFE02800BE0F87, NULL, NULL, 17, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'renault-koleos-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_3852964C8DD14AA6AD94B335512E891C uniqueidentifier
    SELECT @parentId_3852964C8DD14AA6AD94B335512E891C = Id FROM Categories WHERE Slug = 'renault' AND IsDeleted = 0
    IF @parentId_3852964C8DD14AA6AD94B335512E891C IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('3852964C-8DD1-4AA6-AD94-B335512E891C', N'Koleos I', 'renault-koleos-i', @parentId_3852964C8DD14AA6AD94B335512E891C, NULL, NULL, 18, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'renault-koleos-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_EC336DB5298E412EA5017B2616C6736B uniqueidentifier
    SELECT @parentId_EC336DB5298E412EA5017B2616C6736B = Id FROM Categories WHERE Slug = 'renault' AND IsDeleted = 0
    IF @parentId_EC336DB5298E412EA5017B2616C6736B IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('EC336DB5-298E-412E-A501-7B2616C6736B', N'Koleos II', 'renault-koleos-ii', @parentId_EC336DB5298E412EA5017B2616C6736B, NULL, NULL, 19, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'renault-sandero-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_B5999D2653284756ADFD9913E631D005 uniqueidentifier
    SELECT @parentId_B5999D2653284756ADFD9913E631D005 = Id FROM Categories WHERE Slug = 'renault' AND IsDeleted = 0
    IF @parentId_B5999D2653284756ADFD9913E631D005 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('B5999D26-5328-4756-ADFD-9913E631D005', N'Sandero I', 'renault-sandero-i', @parentId_B5999D2653284756ADFD9913E631D005, NULL, NULL, 20, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'renault-sandero-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_6C4A6AFBE7DA4464A9B5E4AAE12DA4A4 uniqueidentifier
    SELECT @parentId_6C4A6AFBE7DA4464A9B5E4AAE12DA4A4 = Id FROM Categories WHERE Slug = 'renault' AND IsDeleted = 0
    IF @parentId_6C4A6AFBE7DA4464A9B5E4AAE12DA4A4 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('6C4A6AFB-E7DA-4464-A9B5-E4AAE12DA4A4', N'Sandero II', 'renault-sandero-ii', @parentId_6C4A6AFBE7DA4464A9B5E4AAE12DA4A4, NULL, NULL, 21, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'renault-sandero-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_57D8C47C32C14A2EB09E0201F3398416 uniqueidentifier
    SELECT @parentId_57D8C47C32C14A2EB09E0201F3398416 = Id FROM Categories WHERE Slug = 'renault' AND IsDeleted = 0
    IF @parentId_57D8C47C32C14A2EB09E0201F3398416 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('57D8C47C-32C1-4A2E-B09E-0201F3398416', N'Sandero III', 'renault-sandero-iii', @parentId_57D8C47C32C14A2EB09E0201F3398416, NULL, NULL, 22, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'renault-symbol-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_65847854D8044EB5B0EFF1BCBE2CAB7B uniqueidentifier
    SELECT @parentId_65847854D8044EB5B0EFF1BCBE2CAB7B = Id FROM Categories WHERE Slug = 'renault' AND IsDeleted = 0
    IF @parentId_65847854D8044EB5B0EFF1BCBE2CAB7B IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('65847854-D804-4EB5-B0EF-F1BCBE2CAB7B', N'Symbol I', 'renault-symbol-i', @parentId_65847854D8044EB5B0EFF1BCBE2CAB7B, NULL, NULL, 23, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'renault-symbol-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_33EAC83C4A514150B4E3C24815251168 uniqueidentifier
    SELECT @parentId_33EAC83C4A514150B4E3C24815251168 = Id FROM Categories WHERE Slug = 'renault' AND IsDeleted = 0
    IF @parentId_33EAC83C4A514150B4E3C24815251168 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('33EAC83C-4A51-4150-B4E3-C24815251168', N'Symbol II', 'renault-symbol-ii', @parentId_33EAC83C4A514150B4E3C24815251168, NULL, NULL, 24, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'renault-symbol-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_D7005D4E1C004A71B3138086ED505709 uniqueidentifier
    SELECT @parentId_D7005D4E1C004A71B3138086ED505709 = Id FROM Categories WHERE Slug = 'renault' AND IsDeleted = 0
    IF @parentId_D7005D4E1C004A71B3138086ED505709 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('D7005D4E-1C00-4A71-B313-8086ED505709', N'Symbol III', 'renault-symbol-iii', @parentId_D7005D4E1C004A71B3138086ED505709, NULL, NULL, 25, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'renault-fluence' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_2E53BACF803B495CBA12ABB2A78388DD uniqueidentifier
    SELECT @parentId_2E53BACF803B495CBA12ABB2A78388DD = Id FROM Categories WHERE Slug = 'renault' AND IsDeleted = 0
    IF @parentId_2E53BACF803B495CBA12ABB2A78388DD IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('2E53BACF-803B-495C-BA12-ABB2A78388DD', N'Fluence', 'renault-fluence', @parentId_2E53BACF803B495CBA12ABB2A78388DD, NULL, NULL, 26, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'renault-talisman' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_05C6751ACCB3415DB88943DFB7759F91 uniqueidentifier
    SELECT @parentId_05C6751ACCB3415DB88943DFB7759F91 = Id FROM Categories WHERE Slug = 'renault' AND IsDeleted = 0
    IF @parentId_05C6751ACCB3415DB88943DFB7759F91 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('05C6751A-CCB3-415D-B889-43DFB7759F91', N'Talisman', 'renault-talisman', @parentId_05C6751ACCB3415DB88943DFB7759F91, NULL, NULL, 27, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'renault-kangoo-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_9AC3EAB0DE8D491586017E9BAA0F8A28 uniqueidentifier
    SELECT @parentId_9AC3EAB0DE8D491586017E9BAA0F8A28 = Id FROM Categories WHERE Slug = 'renault' AND IsDeleted = 0
    IF @parentId_9AC3EAB0DE8D491586017E9BAA0F8A28 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('9AC3EAB0-DE8D-4915-8601-7E9BAA0F8A28', N'Kangoo I', 'renault-kangoo-i', @parentId_9AC3EAB0DE8D491586017E9BAA0F8A28, NULL, NULL, 28, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'renault-kangoo-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_3AED701A2C9444F1A40FB3CFDD1C881E uniqueidentifier
    SELECT @parentId_3AED701A2C9444F1A40FB3CFDD1C881E = Id FROM Categories WHERE Slug = 'renault' AND IsDeleted = 0
    IF @parentId_3AED701A2C9444F1A40FB3CFDD1C881E IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('3AED701A-2C94-44F1-A40F-B3CFDD1C881E', N'Kangoo II', 'renault-kangoo-ii', @parentId_3AED701A2C9444F1A40FB3CFDD1C881E, NULL, NULL, 29, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'renault-kangoo-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_585C34FBBCD1474CA5E6B88EA7D84282 uniqueidentifier
    SELECT @parentId_585C34FBBCD1474CA5E6B88EA7D84282 = Id FROM Categories WHERE Slug = 'renault' AND IsDeleted = 0
    IF @parentId_585C34FBBCD1474CA5E6B88EA7D84282 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('585C34FB-BCD1-474C-A5E6-B88EA7D84282', N'Kangoo III', 'renault-kangoo-iii', @parentId_585C34FBBCD1474CA5E6B88EA7D84282, NULL, NULL, 30, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'renault-master-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_975A4D92941648E8A4C88551F6AC7A9D uniqueidentifier
    SELECT @parentId_975A4D92941648E8A4C88551F6AC7A9D = Id FROM Categories WHERE Slug = 'renault' AND IsDeleted = 0
    IF @parentId_975A4D92941648E8A4C88551F6AC7A9D IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('975A4D92-9416-48E8-A4C8-8551F6AC7A9D', N'Master II', 'renault-master-ii', @parentId_975A4D92941648E8A4C88551F6AC7A9D, NULL, NULL, 31, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'renault-master-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_74DD9C9695FB4A5E9514A96A80608514 uniqueidentifier
    SELECT @parentId_74DD9C9695FB4A5E9514A96A80608514 = Id FROM Categories WHERE Slug = 'renault' AND IsDeleted = 0
    IF @parentId_74DD9C9695FB4A5E9514A96A80608514 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('74DD9C96-95FB-4A5E-9514-A96A80608514', N'Master III', 'renault-master-iii', @parentId_74DD9C9695FB4A5E9514A96A80608514, NULL, NULL, 32, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'renault-trafic-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_49639D8BDFA44219BB8A9F1E2EB2C9CC uniqueidentifier
    SELECT @parentId_49639D8BDFA44219BB8A9F1E2EB2C9CC = Id FROM Categories WHERE Slug = 'renault' AND IsDeleted = 0
    IF @parentId_49639D8BDFA44219BB8A9F1E2EB2C9CC IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('49639D8B-DFA4-4219-BB8A-9F1E2EB2C9CC', N'Trafic II', 'renault-trafic-ii', @parentId_49639D8BDFA44219BB8A9F1E2EB2C9CC, NULL, NULL, 33, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'renault-trafic-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_F4EB212EA839420984D14AAF0E94D1C3 uniqueidentifier
    SELECT @parentId_F4EB212EA839420984D14AAF0E94D1C3 = Id FROM Categories WHERE Slug = 'renault' AND IsDeleted = 0
    IF @parentId_F4EB212EA839420984D14AAF0E94D1C3 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('F4EB212E-A839-4209-84D1-4AAF0E94D1C3', N'Trafic III', 'renault-trafic-iii', @parentId_F4EB212EA839420984D14AAF0E94D1C3, NULL, NULL, 34, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'peugeot' AND IsDeleted = 0)
BEGIN
    INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
    VALUES ('281EBD6D-18F2-42A9-8357-AE8FE3172229', N'Peugeot', 'peugeot', NULL, NULL, NULL, 10, 1, 1, 1, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
ELSE
BEGIN
    -- Varsa ShowInVehicleNav=true gÃ¼ncelle
    UPDATE Categories SET ShowInVehicleNav = 1 WHERE Slug = 'peugeot' AND IsDeleted = 0
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'peugeot-106' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_7D77F109128246978236AF194F4A7B07 uniqueidentifier
    SELECT @parentId_7D77F109128246978236AF194F4A7B07 = Id FROM Categories WHERE Slug = 'peugeot' AND IsDeleted = 0
    IF @parentId_7D77F109128246978236AF194F4A7B07 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('7D77F109-1282-4697-8236-AF194F4A7B07', N'106', 'peugeot-106', @parentId_7D77F109128246978236AF194F4A7B07, NULL, NULL, 0, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'peugeot-107' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_B82FF34FA0B2455BA742DDB1BE2B3A1C uniqueidentifier
    SELECT @parentId_B82FF34FA0B2455BA742DDB1BE2B3A1C = Id FROM Categories WHERE Slug = 'peugeot' AND IsDeleted = 0
    IF @parentId_B82FF34FA0B2455BA742DDB1BE2B3A1C IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('B82FF34F-A0B2-455B-A742-DDB1BE2B3A1C', N'107', 'peugeot-107', @parentId_B82FF34FA0B2455BA742DDB1BE2B3A1C, NULL, NULL, 1, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'peugeot-108' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_440372B8A42A4097B287C371732435F5 uniqueidentifier
    SELECT @parentId_440372B8A42A4097B287C371732435F5 = Id FROM Categories WHERE Slug = 'peugeot' AND IsDeleted = 0
    IF @parentId_440372B8A42A4097B287C371732435F5 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('440372B8-A42A-4097-B287-C371732435F5', N'108', 'peugeot-108', @parentId_440372B8A42A4097B287C371732435F5, NULL, NULL, 2, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'peugeot-206' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_AA6A0C865A7346B08D24B2FB03E567CA uniqueidentifier
    SELECT @parentId_AA6A0C865A7346B08D24B2FB03E567CA = Id FROM Categories WHERE Slug = 'peugeot' AND IsDeleted = 0
    IF @parentId_AA6A0C865A7346B08D24B2FB03E567CA IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('AA6A0C86-5A73-46B0-8D24-B2FB03E567CA', N'206', 'peugeot-206', @parentId_AA6A0C865A7346B08D24B2FB03E567CA, NULL, NULL, 3, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'peugeot-207' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_680B316876A14603B5BECE3CA8DFD82A uniqueidentifier
    SELECT @parentId_680B316876A14603B5BECE3CA8DFD82A = Id FROM Categories WHERE Slug = 'peugeot' AND IsDeleted = 0
    IF @parentId_680B316876A14603B5BECE3CA8DFD82A IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('680B3168-76A1-4603-B5BE-CE3CA8DFD82A', N'207', 'peugeot-207', @parentId_680B316876A14603B5BECE3CA8DFD82A, NULL, NULL, 4, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'peugeot-208-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_8A93507661604D06B3325091ACB55202 uniqueidentifier
    SELECT @parentId_8A93507661604D06B3325091ACB55202 = Id FROM Categories WHERE Slug = 'peugeot' AND IsDeleted = 0
    IF @parentId_8A93507661604D06B3325091ACB55202 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('8A935076-6160-4D06-B332-5091ACB55202', N'208 I', 'peugeot-208-i', @parentId_8A93507661604D06B3325091ACB55202, NULL, NULL, 5, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'peugeot-208-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_78A4D964DE7742F491836A81CD747743 uniqueidentifier
    SELECT @parentId_78A4D964DE7742F491836A81CD747743 = Id FROM Categories WHERE Slug = 'peugeot' AND IsDeleted = 0
    IF @parentId_78A4D964DE7742F491836A81CD747743 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('78A4D964-DE77-42F4-9183-6A81CD747743', N'208 II', 'peugeot-208-ii', @parentId_78A4D964DE7742F491836A81CD747743, NULL, NULL, 6, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'peugeot-306' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_C14C96DF70DA4F51B47A6DB335FBFC6F uniqueidentifier
    SELECT @parentId_C14C96DF70DA4F51B47A6DB335FBFC6F = Id FROM Categories WHERE Slug = 'peugeot' AND IsDeleted = 0
    IF @parentId_C14C96DF70DA4F51B47A6DB335FBFC6F IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('C14C96DF-70DA-4F51-B47A-6DB335FBFC6F', N'306', 'peugeot-306', @parentId_C14C96DF70DA4F51B47A6DB335FBFC6F, NULL, NULL, 7, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'peugeot-307' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_05A568B0269B4C5882E508587E302F47 uniqueidentifier
    SELECT @parentId_05A568B0269B4C5882E508587E302F47 = Id FROM Categories WHERE Slug = 'peugeot' AND IsDeleted = 0
    IF @parentId_05A568B0269B4C5882E508587E302F47 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('05A568B0-269B-4C58-82E5-08587E302F47', N'307', 'peugeot-307', @parentId_05A568B0269B4C5882E508587E302F47, NULL, NULL, 8, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'peugeot-308-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_774A604124634FC6A2B9195C207E2A81 uniqueidentifier
    SELECT @parentId_774A604124634FC6A2B9195C207E2A81 = Id FROM Categories WHERE Slug = 'peugeot' AND IsDeleted = 0
    IF @parentId_774A604124634FC6A2B9195C207E2A81 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('774A6041-2463-4FC6-A2B9-195C207E2A81', N'308 I', 'peugeot-308-i', @parentId_774A604124634FC6A2B9195C207E2A81, NULL, NULL, 9, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'peugeot-308-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_874CCC6648AE4439A38A9FE359680F27 uniqueidentifier
    SELECT @parentId_874CCC6648AE4439A38A9FE359680F27 = Id FROM Categories WHERE Slug = 'peugeot' AND IsDeleted = 0
    IF @parentId_874CCC6648AE4439A38A9FE359680F27 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('874CCC66-48AE-4439-A38A-9FE359680F27', N'308 II', 'peugeot-308-ii', @parentId_874CCC6648AE4439A38A9FE359680F27, NULL, NULL, 10, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'peugeot-407' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_3E1BD9611D384DA081F4B24F6003E0B2 uniqueidentifier
    SELECT @parentId_3E1BD9611D384DA081F4B24F6003E0B2 = Id FROM Categories WHERE Slug = 'peugeot' AND IsDeleted = 0
    IF @parentId_3E1BD9611D384DA081F4B24F6003E0B2 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('3E1BD961-1D38-4DA0-81F4-B24F6003E0B2', N'407', 'peugeot-407', @parentId_3E1BD9611D384DA081F4B24F6003E0B2, NULL, NULL, 11, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'peugeot-408' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_52D248E8AFD8479D9E7C4542B14E1B0C uniqueidentifier
    SELECT @parentId_52D248E8AFD8479D9E7C4542B14E1B0C = Id FROM Categories WHERE Slug = 'peugeot' AND IsDeleted = 0
    IF @parentId_52D248E8AFD8479D9E7C4542B14E1B0C IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('52D248E8-AFD8-479D-9E7C-4542B14E1B0C', N'408', 'peugeot-408', @parentId_52D248E8AFD8479D9E7C4542B14E1B0C, NULL, NULL, 12, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'peugeot-508-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_9780237BCAB540398C526DDCF5BCAE10 uniqueidentifier
    SELECT @parentId_9780237BCAB540398C526DDCF5BCAE10 = Id FROM Categories WHERE Slug = 'peugeot' AND IsDeleted = 0
    IF @parentId_9780237BCAB540398C526DDCF5BCAE10 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('9780237B-CAB5-4039-8C52-6DDCF5BCAE10', N'508 I', 'peugeot-508-i', @parentId_9780237BCAB540398C526DDCF5BCAE10, NULL, NULL, 13, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'peugeot-508-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_7E39AA0B6B8F4562AC141396B29348B9 uniqueidentifier
    SELECT @parentId_7E39AA0B6B8F4562AC141396B29348B9 = Id FROM Categories WHERE Slug = 'peugeot' AND IsDeleted = 0
    IF @parentId_7E39AA0B6B8F4562AC141396B29348B9 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('7E39AA0B-6B8F-4562-AC14-1396B29348B9', N'508 II', 'peugeot-508-ii', @parentId_7E39AA0B6B8F4562AC141396B29348B9, NULL, NULL, 14, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'peugeot-2008-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_99C96CEE517440B3B30FF37F05B7CD2D uniqueidentifier
    SELECT @parentId_99C96CEE517440B3B30FF37F05B7CD2D = Id FROM Categories WHERE Slug = 'peugeot' AND IsDeleted = 0
    IF @parentId_99C96CEE517440B3B30FF37F05B7CD2D IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('99C96CEE-5174-40B3-B30F-F37F05B7CD2D', N'2008 I', 'peugeot-2008-i', @parentId_99C96CEE517440B3B30FF37F05B7CD2D, NULL, NULL, 15, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'peugeot-2008-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_6AC95AF6EC6F4A5CAB6D06A87359C1E4 uniqueidentifier
    SELECT @parentId_6AC95AF6EC6F4A5CAB6D06A87359C1E4 = Id FROM Categories WHERE Slug = 'peugeot' AND IsDeleted = 0
    IF @parentId_6AC95AF6EC6F4A5CAB6D06A87359C1E4 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('6AC95AF6-EC6F-4A5C-AB6D-06A87359C1E4', N'2008 II', 'peugeot-2008-ii', @parentId_6AC95AF6EC6F4A5CAB6D06A87359C1E4, NULL, NULL, 16, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'peugeot-3008-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_F374E22D90EF4308BA00A117A2101497 uniqueidentifier
    SELECT @parentId_F374E22D90EF4308BA00A117A2101497 = Id FROM Categories WHERE Slug = 'peugeot' AND IsDeleted = 0
    IF @parentId_F374E22D90EF4308BA00A117A2101497 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('F374E22D-90EF-4308-BA00-A117A2101497', N'3008 I', 'peugeot-3008-i', @parentId_F374E22D90EF4308BA00A117A2101497, NULL, NULL, 17, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'peugeot-3008-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_54678C6B2EA24662B6A4061D9922FC69 uniqueidentifier
    SELECT @parentId_54678C6B2EA24662B6A4061D9922FC69 = Id FROM Categories WHERE Slug = 'peugeot' AND IsDeleted = 0
    IF @parentId_54678C6B2EA24662B6A4061D9922FC69 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('54678C6B-2EA2-4662-B6A4-061D9922FC69', N'3008 II', 'peugeot-3008-ii', @parentId_54678C6B2EA24662B6A4061D9922FC69, NULL, NULL, 18, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'peugeot-5008-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_9FFF59E11D05416EAF78D4CC7F533B2A uniqueidentifier
    SELECT @parentId_9FFF59E11D05416EAF78D4CC7F533B2A = Id FROM Categories WHERE Slug = 'peugeot' AND IsDeleted = 0
    IF @parentId_9FFF59E11D05416EAF78D4CC7F533B2A IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('9FFF59E1-1D05-416E-AF78-D4CC7F533B2A', N'5008 I', 'peugeot-5008-i', @parentId_9FFF59E11D05416EAF78D4CC7F533B2A, NULL, NULL, 19, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'peugeot-5008-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_784FCCD68928488B8231B8624CC8BF79 uniqueidentifier
    SELECT @parentId_784FCCD68928488B8231B8624CC8BF79 = Id FROM Categories WHERE Slug = 'peugeot' AND IsDeleted = 0
    IF @parentId_784FCCD68928488B8231B8624CC8BF79 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('784FCCD6-8928-488B-8231-B8624CC8BF79', N'5008 II', 'peugeot-5008-ii', @parentId_784FCCD68928488B8231B8624CC8BF79, NULL, NULL, 20, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'peugeot-partner-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_2DF01B14FCCA46239E9BEA80739DEA37 uniqueidentifier
    SELECT @parentId_2DF01B14FCCA46239E9BEA80739DEA37 = Id FROM Categories WHERE Slug = 'peugeot' AND IsDeleted = 0
    IF @parentId_2DF01B14FCCA46239E9BEA80739DEA37 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('2DF01B14-FCCA-4623-9E9B-EA80739DEA37', N'Partner I', 'peugeot-partner-i', @parentId_2DF01B14FCCA46239E9BEA80739DEA37, NULL, NULL, 21, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'peugeot-partner-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_EFDDD8405F2F464A8DF2247761CF68EF uniqueidentifier
    SELECT @parentId_EFDDD8405F2F464A8DF2247761CF68EF = Id FROM Categories WHERE Slug = 'peugeot' AND IsDeleted = 0
    IF @parentId_EFDDD8405F2F464A8DF2247761CF68EF IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('EFDDD840-5F2F-464A-8DF2-247761CF68EF', N'Partner II', 'peugeot-partner-ii', @parentId_EFDDD8405F2F464A8DF2247761CF68EF, NULL, NULL, 22, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'peugeot-partner-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_9CDEAD5108E04B0296EF947A92828A73 uniqueidentifier
    SELECT @parentId_9CDEAD5108E04B0296EF947A92828A73 = Id FROM Categories WHERE Slug = 'peugeot' AND IsDeleted = 0
    IF @parentId_9CDEAD5108E04B0296EF947A92828A73 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('9CDEAD51-08E0-4B02-96EF-947A92828A73', N'Partner III', 'peugeot-partner-iii', @parentId_9CDEAD5108E04B0296EF947A92828A73, NULL, NULL, 23, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'peugeot-expert-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_949F8EABB57C4B9AB8C9DC801D27768D uniqueidentifier
    SELECT @parentId_949F8EABB57C4B9AB8C9DC801D27768D = Id FROM Categories WHERE Slug = 'peugeot' AND IsDeleted = 0
    IF @parentId_949F8EABB57C4B9AB8C9DC801D27768D IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('949F8EAB-B57C-4B9A-B8C9-DC801D27768D', N'Expert I', 'peugeot-expert-i', @parentId_949F8EABB57C4B9AB8C9DC801D27768D, NULL, NULL, 24, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'peugeot-expert-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_CD822AA0DF9445B6BF0289B93CFBD55C uniqueidentifier
    SELECT @parentId_CD822AA0DF9445B6BF0289B93CFBD55C = Id FROM Categories WHERE Slug = 'peugeot' AND IsDeleted = 0
    IF @parentId_CD822AA0DF9445B6BF0289B93CFBD55C IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('CD822AA0-DF94-45B6-BF02-89B93CFBD55C', N'Expert II', 'peugeot-expert-ii', @parentId_CD822AA0DF9445B6BF0289B93CFBD55C, NULL, NULL, 25, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'peugeot-boxer-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_0D63D72DA9AA462199AF91520D8178FE uniqueidentifier
    SELECT @parentId_0D63D72DA9AA462199AF91520D8178FE = Id FROM Categories WHERE Slug = 'peugeot' AND IsDeleted = 0
    IF @parentId_0D63D72DA9AA462199AF91520D8178FE IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('0D63D72D-A9AA-4621-99AF-91520D8178FE', N'Boxer II', 'peugeot-boxer-ii', @parentId_0D63D72DA9AA462199AF91520D8178FE, NULL, NULL, 26, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'peugeot-boxer-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_71A6F6CBB6B743CA93E9CBFAD65E75EB uniqueidentifier
    SELECT @parentId_71A6F6CBB6B743CA93E9CBFAD65E75EB = Id FROM Categories WHERE Slug = 'peugeot' AND IsDeleted = 0
    IF @parentId_71A6F6CBB6B743CA93E9CBFAD65E75EB IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('71A6F6CB-B6B7-43CA-93E9-CBFAD65E75EB', N'Boxer III', 'peugeot-boxer-iii', @parentId_71A6F6CBB6B743CA93E9CBFAD65E75EB, NULL, NULL, 27, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'citroen' AND IsDeleted = 0)
BEGIN
    INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
    VALUES ('58A47130-1B53-480F-826D-A88255435088', N'Citroen', 'citroen', NULL, NULL, NULL, 11, 1, 1, 1, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
ELSE
BEGIN
    -- Varsa ShowInVehicleNav=true gÃ¼ncelle
    UPDATE Categories SET ShowInVehicleNav = 1 WHERE Slug = 'citroen' AND IsDeleted = 0
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'citroen-c1-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_599A18C780E143F4A22F5D9AFC32943A uniqueidentifier
    SELECT @parentId_599A18C780E143F4A22F5D9AFC32943A = Id FROM Categories WHERE Slug = 'citroen' AND IsDeleted = 0
    IF @parentId_599A18C780E143F4A22F5D9AFC32943A IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('599A18C7-80E1-43F4-A22F-5D9AFC32943A', N'C1 I', 'citroen-c1-i', @parentId_599A18C780E143F4A22F5D9AFC32943A, NULL, NULL, 0, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'citroen-c1-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_59D0F9CD6A4F431AB7EC3BBBF4371E9E uniqueidentifier
    SELECT @parentId_59D0F9CD6A4F431AB7EC3BBBF4371E9E = Id FROM Categories WHERE Slug = 'citroen' AND IsDeleted = 0
    IF @parentId_59D0F9CD6A4F431AB7EC3BBBF4371E9E IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('59D0F9CD-6A4F-431A-B7EC-3BBBF4371E9E', N'C1 II', 'citroen-c1-ii', @parentId_59D0F9CD6A4F431AB7EC3BBBF4371E9E, NULL, NULL, 1, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'citroen-c2' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_9CAC2D8BCC674EDB9D21B9696F70172E uniqueidentifier
    SELECT @parentId_9CAC2D8BCC674EDB9D21B9696F70172E = Id FROM Categories WHERE Slug = 'citroen' AND IsDeleted = 0
    IF @parentId_9CAC2D8BCC674EDB9D21B9696F70172E IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('9CAC2D8B-CC67-4EDB-9D21-B9696F70172E', N'C2', 'citroen-c2', @parentId_9CAC2D8BCC674EDB9D21B9696F70172E, NULL, NULL, 2, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'citroen-c3-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_1B522A3F3A604CD2839489B2F0D68E9E uniqueidentifier
    SELECT @parentId_1B522A3F3A604CD2839489B2F0D68E9E = Id FROM Categories WHERE Slug = 'citroen' AND IsDeleted = 0
    IF @parentId_1B522A3F3A604CD2839489B2F0D68E9E IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('1B522A3F-3A60-4CD2-8394-89B2F0D68E9E', N'C3 I', 'citroen-c3-i', @parentId_1B522A3F3A604CD2839489B2F0D68E9E, NULL, NULL, 3, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'citroen-c3-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_F8C880992367440883847DA83E50936D uniqueidentifier
    SELECT @parentId_F8C880992367440883847DA83E50936D = Id FROM Categories WHERE Slug = 'citroen' AND IsDeleted = 0
    IF @parentId_F8C880992367440883847DA83E50936D IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('F8C88099-2367-4408-8384-7DA83E50936D', N'C3 II', 'citroen-c3-ii', @parentId_F8C880992367440883847DA83E50936D, NULL, NULL, 4, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'citroen-c3-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_2A5BB30D856E444ABAF5D23495E83EE0 uniqueidentifier
    SELECT @parentId_2A5BB30D856E444ABAF5D23495E83EE0 = Id FROM Categories WHERE Slug = 'citroen' AND IsDeleted = 0
    IF @parentId_2A5BB30D856E444ABAF5D23495E83EE0 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('2A5BB30D-856E-444A-BAF5-D23495E83EE0', N'C3 III', 'citroen-c3-iii', @parentId_2A5BB30D856E444ABAF5D23495E83EE0, NULL, NULL, 5, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'citroen-c4-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_4520D562AC484DBA930A83DB0006401C uniqueidentifier
    SELECT @parentId_4520D562AC484DBA930A83DB0006401C = Id FROM Categories WHERE Slug = 'citroen' AND IsDeleted = 0
    IF @parentId_4520D562AC484DBA930A83DB0006401C IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('4520D562-AC48-4DBA-930A-83DB0006401C', N'C4 I', 'citroen-c4-i', @parentId_4520D562AC484DBA930A83DB0006401C, NULL, NULL, 6, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'citroen-c4-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_9CC78C0284454BE393B6D66C5BC6924A uniqueidentifier
    SELECT @parentId_9CC78C0284454BE393B6D66C5BC6924A = Id FROM Categories WHERE Slug = 'citroen' AND IsDeleted = 0
    IF @parentId_9CC78C0284454BE393B6D66C5BC6924A IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('9CC78C02-8445-4BE3-93B6-D66C5BC6924A', N'C4 II', 'citroen-c4-ii', @parentId_9CC78C0284454BE393B6D66C5BC6924A, NULL, NULL, 7, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'citroen-c4-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_BF79EB303DEF477A83A78D22EB27D016 uniqueidentifier
    SELECT @parentId_BF79EB303DEF477A83A78D22EB27D016 = Id FROM Categories WHERE Slug = 'citroen' AND IsDeleted = 0
    IF @parentId_BF79EB303DEF477A83A78D22EB27D016 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('BF79EB30-3DEF-477A-83A7-8D22EB27D016', N'C4 III', 'citroen-c4-iii', @parentId_BF79EB303DEF477A83A78D22EB27D016, NULL, NULL, 8, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'citroen-c5-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_312CF064B4174FF08F7E7C9D0A68382E uniqueidentifier
    SELECT @parentId_312CF064B4174FF08F7E7C9D0A68382E = Id FROM Categories WHERE Slug = 'citroen' AND IsDeleted = 0
    IF @parentId_312CF064B4174FF08F7E7C9D0A68382E IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('312CF064-B417-4FF0-8F7E-7C9D0A68382E', N'C5 I', 'citroen-c5-i', @parentId_312CF064B4174FF08F7E7C9D0A68382E, NULL, NULL, 9, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'citroen-c5-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_2F2E9E92B4D6451FA91A683E35E0A44F uniqueidentifier
    SELECT @parentId_2F2E9E92B4D6451FA91A683E35E0A44F = Id FROM Categories WHERE Slug = 'citroen' AND IsDeleted = 0
    IF @parentId_2F2E9E92B4D6451FA91A683E35E0A44F IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('2F2E9E92-B4D6-451F-A91A-683E35E0A44F', N'C5 II', 'citroen-c5-ii', @parentId_2F2E9E92B4D6451FA91A683E35E0A44F, NULL, NULL, 10, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'citroen-c5-x' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_F7E43FBC1E5C405C902E07E04521EB40 uniqueidentifier
    SELECT @parentId_F7E43FBC1E5C405C902E07E04521EB40 = Id FROM Categories WHERE Slug = 'citroen' AND IsDeleted = 0
    IF @parentId_F7E43FBC1E5C405C902E07E04521EB40 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('F7E43FBC-1E5C-405C-902E-07E04521EB40', N'C5 X', 'citroen-c5-x', @parentId_F7E43FBC1E5C405C902E07E04521EB40, NULL, NULL, 11, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'citroen-c3-aircross' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_7751EE574C064183839734E9601FF20D uniqueidentifier
    SELECT @parentId_7751EE574C064183839734E9601FF20D = Id FROM Categories WHERE Slug = 'citroen' AND IsDeleted = 0
    IF @parentId_7751EE574C064183839734E9601FF20D IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('7751EE57-4C06-4183-8397-34E9601FF20D', N'C3 Aircross', 'citroen-c3-aircross', @parentId_7751EE574C064183839734E9601FF20D, NULL, NULL, 12, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'citroen-c4-cactus' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_9D70BE2A0A5B4241AF65C3C70445D51F uniqueidentifier
    SELECT @parentId_9D70BE2A0A5B4241AF65C3C70445D51F = Id FROM Categories WHERE Slug = 'citroen' AND IsDeleted = 0
    IF @parentId_9D70BE2A0A5B4241AF65C3C70445D51F IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('9D70BE2A-0A5B-4241-AF65-C3C70445D51F', N'C4 Cactus', 'citroen-c4-cactus', @parentId_9D70BE2A0A5B4241AF65C3C70445D51F, NULL, NULL, 13, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'citroen-c5-aircross' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_2E58C1315C1B4264B89987D70AFBA9F9 uniqueidentifier
    SELECT @parentId_2E58C1315C1B4264B89987D70AFBA9F9 = Id FROM Categories WHERE Slug = 'citroen' AND IsDeleted = 0
    IF @parentId_2E58C1315C1B4264B89987D70AFBA9F9 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('2E58C131-5C1B-4264-B899-87D70AFBA9F9', N'C5 Aircross', 'citroen-c5-aircross', @parentId_2E58C1315C1B4264B89987D70AFBA9F9, NULL, NULL, 14, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'citroen-berlingo-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_E18406A0FDF24B52BD2993434D5DB26B uniqueidentifier
    SELECT @parentId_E18406A0FDF24B52BD2993434D5DB26B = Id FROM Categories WHERE Slug = 'citroen' AND IsDeleted = 0
    IF @parentId_E18406A0FDF24B52BD2993434D5DB26B IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('E18406A0-FDF2-4B52-BD29-93434D5DB26B', N'Berlingo I', 'citroen-berlingo-i', @parentId_E18406A0FDF24B52BD2993434D5DB26B, NULL, NULL, 15, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'citroen-berlingo-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_970AD2BFE79141EF98EE05E989CD52F0 uniqueidentifier
    SELECT @parentId_970AD2BFE79141EF98EE05E989CD52F0 = Id FROM Categories WHERE Slug = 'citroen' AND IsDeleted = 0
    IF @parentId_970AD2BFE79141EF98EE05E989CD52F0 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('970AD2BF-E791-41EF-98EE-05E989CD52F0', N'Berlingo II', 'citroen-berlingo-ii', @parentId_970AD2BFE79141EF98EE05E989CD52F0, NULL, NULL, 16, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'citroen-berlingo-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_BB1FACFE1DA048DFAB1999B476BB6494 uniqueidentifier
    SELECT @parentId_BB1FACFE1DA048DFAB1999B476BB6494 = Id FROM Categories WHERE Slug = 'citroen' AND IsDeleted = 0
    IF @parentId_BB1FACFE1DA048DFAB1999B476BB6494 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('BB1FACFE-1DA0-48DF-AB19-99B476BB6494', N'Berlingo III', 'citroen-berlingo-iii', @parentId_BB1FACFE1DA048DFAB1999B476BB6494, NULL, NULL, 17, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'citroen-jumpy-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_4C4BB4BA4B05479198EC03C96B546CDB uniqueidentifier
    SELECT @parentId_4C4BB4BA4B05479198EC03C96B546CDB = Id FROM Categories WHERE Slug = 'citroen' AND IsDeleted = 0
    IF @parentId_4C4BB4BA4B05479198EC03C96B546CDB IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('4C4BB4BA-4B05-4791-98EC-03C96B546CDB', N'Jumpy I', 'citroen-jumpy-i', @parentId_4C4BB4BA4B05479198EC03C96B546CDB, NULL, NULL, 18, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'citroen-jumpy-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_00FD3834967F4632B78F1F9A02A5BC80 uniqueidentifier
    SELECT @parentId_00FD3834967F4632B78F1F9A02A5BC80 = Id FROM Categories WHERE Slug = 'citroen' AND IsDeleted = 0
    IF @parentId_00FD3834967F4632B78F1F9A02A5BC80 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('00FD3834-967F-4632-B78F-1F9A02A5BC80', N'Jumpy II', 'citroen-jumpy-ii', @parentId_00FD3834967F4632B78F1F9A02A5BC80, NULL, NULL, 19, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'citroen-jumpy-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_A13A490A516842A1B61AC11E4CF82E96 uniqueidentifier
    SELECT @parentId_A13A490A516842A1B61AC11E4CF82E96 = Id FROM Categories WHERE Slug = 'citroen' AND IsDeleted = 0
    IF @parentId_A13A490A516842A1B61AC11E4CF82E96 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('A13A490A-5168-42A1-B61A-C11E4CF82E96', N'Jumpy III', 'citroen-jumpy-iii', @parentId_A13A490A516842A1B61AC11E4CF82E96, NULL, NULL, 20, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'citroen-jumper-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_BB3F70D2AFD848EE9F4706E80CEC8F64 uniqueidentifier
    SELECT @parentId_BB3F70D2AFD848EE9F4706E80CEC8F64 = Id FROM Categories WHERE Slug = 'citroen' AND IsDeleted = 0
    IF @parentId_BB3F70D2AFD848EE9F4706E80CEC8F64 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('BB3F70D2-AFD8-48EE-9F47-06E80CEC8F64', N'Jumper I', 'citroen-jumper-i', @parentId_BB3F70D2AFD848EE9F4706E80CEC8F64, NULL, NULL, 21, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'citroen-jumper-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_4AEB76F065AF4ABC9CBE6AC78F7229B2 uniqueidentifier
    SELECT @parentId_4AEB76F065AF4ABC9CBE6AC78F7229B2 = Id FROM Categories WHERE Slug = 'citroen' AND IsDeleted = 0
    IF @parentId_4AEB76F065AF4ABC9CBE6AC78F7229B2 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('4AEB76F0-65AF-4ABC-9CBE-6AC78F7229B2', N'Jumper II', 'citroen-jumper-ii', @parentId_4AEB76F065AF4ABC9CBE6AC78F7229B2, NULL, NULL, 22, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'citroen-c6' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_C9DA0871FE494B60B542D5A8F131000A uniqueidentifier
    SELECT @parentId_C9DA0871FE494B60B542D5A8F131000A = Id FROM Categories WHERE Slug = 'citroen' AND IsDeleted = 0
    IF @parentId_C9DA0871FE494B60B542D5A8F131000A IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('C9DA0871-FE49-4B60-B542-D5A8F131000A', N'C6', 'citroen-c6', @parentId_C9DA0871FE494B60B542D5A8F131000A, NULL, NULL, 23, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'fiat' AND IsDeleted = 0)
BEGIN
    INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
    VALUES ('090E6253-8E77-43E5-BC14-FDEF0ED0A741', N'Fiat', 'fiat', NULL, NULL, NULL, 12, 1, 1, 1, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
ELSE
BEGIN
    -- Varsa ShowInVehicleNav=true gÃ¼ncelle
    UPDATE Categories SET ShowInVehicleNav = 1 WHERE Slug = 'fiat' AND IsDeleted = 0
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'fiat-500-312' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_21C8C42FF87947DAAD3D477DA8733B2A uniqueidentifier
    SELECT @parentId_21C8C42FF87947DAAD3D477DA8733B2A = Id FROM Categories WHERE Slug = 'fiat' AND IsDeleted = 0
    IF @parentId_21C8C42FF87947DAAD3D477DA8733B2A IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('21C8C42F-F879-47DA-AD3D-477DA8733B2A', N'500 312', 'fiat-500-312', @parentId_21C8C42FF87947DAAD3D477DA8733B2A, NULL, NULL, 0, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'fiat-500-334' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_84AC830A7B504446BBEA5E4E4BDD0B5A uniqueidentifier
    SELECT @parentId_84AC830A7B504446BBEA5E4E4BDD0B5A = Id FROM Categories WHERE Slug = 'fiat' AND IsDeleted = 0
    IF @parentId_84AC830A7B504446BBEA5E4E4BDD0B5A IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('84AC830A-7B50-4446-BBEA-5E4E4BDD0B5A', N'500 334', 'fiat-500-334', @parentId_84AC830A7B504446BBEA5E4E4BDD0B5A, NULL, NULL, 1, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'fiat-punto-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_6FC155FE0F5D417FB058A2A6584DE8B7 uniqueidentifier
    SELECT @parentId_6FC155FE0F5D417FB058A2A6584DE8B7 = Id FROM Categories WHERE Slug = 'fiat' AND IsDeleted = 0
    IF @parentId_6FC155FE0F5D417FB058A2A6584DE8B7 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('6FC155FE-0F5D-417F-B058-A2A6584DE8B7', N'Punto I', 'fiat-punto-i', @parentId_6FC155FE0F5D417FB058A2A6584DE8B7, NULL, NULL, 2, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'fiat-punto-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_2F5C09C63FFC4CA5999A32FC11157054 uniqueidentifier
    SELECT @parentId_2F5C09C63FFC4CA5999A32FC11157054 = Id FROM Categories WHERE Slug = 'fiat' AND IsDeleted = 0
    IF @parentId_2F5C09C63FFC4CA5999A32FC11157054 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('2F5C09C6-3FFC-4CA5-999A-32FC11157054', N'Punto II', 'fiat-punto-ii', @parentId_2F5C09C63FFC4CA5999A32FC11157054, NULL, NULL, 3, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'fiat-punto-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_5B7C5BFEA0AF4C02BA60162815A777F1 uniqueidentifier
    SELECT @parentId_5B7C5BFEA0AF4C02BA60162815A777F1 = Id FROM Categories WHERE Slug = 'fiat' AND IsDeleted = 0
    IF @parentId_5B7C5BFEA0AF4C02BA60162815A777F1 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('5B7C5BFE-A0AF-4C02-BA60-162815A777F1', N'Punto III', 'fiat-punto-iii', @parentId_5B7C5BFEA0AF4C02BA60162815A777F1, NULL, NULL, 4, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'fiat-doblo-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_C1CD573A8F1C4BDA914908C2BA899687 uniqueidentifier
    SELECT @parentId_C1CD573A8F1C4BDA914908C2BA899687 = Id FROM Categories WHERE Slug = 'fiat' AND IsDeleted = 0
    IF @parentId_C1CD573A8F1C4BDA914908C2BA899687 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('C1CD573A-8F1C-4BDA-9149-08C2BA899687', N'Doblo I', 'fiat-doblo-i', @parentId_C1CD573A8F1C4BDA914908C2BA899687, NULL, NULL, 5, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'fiat-doblo-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_A7256750C086403D9F6A3023CFFBCBCA uniqueidentifier
    SELECT @parentId_A7256750C086403D9F6A3023CFFBCBCA = Id FROM Categories WHERE Slug = 'fiat' AND IsDeleted = 0
    IF @parentId_A7256750C086403D9F6A3023CFFBCBCA IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('A7256750-C086-403D-9F6A-3023CFFBCBCA', N'Doblo II', 'fiat-doblo-ii', @parentId_A7256750C086403D9F6A3023CFFBCBCA, NULL, NULL, 6, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'fiat-doblo-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_381B78E5040546DA9E512611DAD9C1FD uniqueidentifier
    SELECT @parentId_381B78E5040546DA9E512611DAD9C1FD = Id FROM Categories WHERE Slug = 'fiat' AND IsDeleted = 0
    IF @parentId_381B78E5040546DA9E512611DAD9C1FD IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('381B78E5-0405-46DA-9E51-2611DAD9C1FD', N'Doblo III', 'fiat-doblo-iii', @parentId_381B78E5040546DA9E512611DAD9C1FD, NULL, NULL, 7, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'fiat-fiorino-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_2E4F803DD6E34318B3F34C3B7B4DA8C6 uniqueidentifier
    SELECT @parentId_2E4F803DD6E34318B3F34C3B7B4DA8C6 = Id FROM Categories WHERE Slug = 'fiat' AND IsDeleted = 0
    IF @parentId_2E4F803DD6E34318B3F34C3B7B4DA8C6 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('2E4F803D-D6E3-4318-B3F3-4C3B7B4DA8C6', N'Fiorino III', 'fiat-fiorino-iii', @parentId_2E4F803DD6E34318B3F34C3B7B4DA8C6, NULL, NULL, 8, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'fiat-fiorino-iv' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_D5716886BE51462C8AB903E7F5C668C5 uniqueidentifier
    SELECT @parentId_D5716886BE51462C8AB903E7F5C668C5 = Id FROM Categories WHERE Slug = 'fiat' AND IsDeleted = 0
    IF @parentId_D5716886BE51462C8AB903E7F5C668C5 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('D5716886-BE51-462C-8AB9-03E7F5C668C5', N'Fiorino IV', 'fiat-fiorino-iv', @parentId_D5716886BE51462C8AB903E7F5C668C5, NULL, NULL, 9, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'fiat-tipo-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_84F1CCCCE876430682FB10B44CE8A6E7 uniqueidentifier
    SELECT @parentId_84F1CCCCE876430682FB10B44CE8A6E7 = Id FROM Categories WHERE Slug = 'fiat' AND IsDeleted = 0
    IF @parentId_84F1CCCCE876430682FB10B44CE8A6E7 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('84F1CCCC-E876-4306-82FB-10B44CE8A6E7', N'Tipo I', 'fiat-tipo-i', @parentId_84F1CCCCE876430682FB10B44CE8A6E7, NULL, NULL, 10, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'fiat-tipo-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_1AC5C8959D154CACBC193A018D177BED uniqueidentifier
    SELECT @parentId_1AC5C8959D154CACBC193A018D177BED = Id FROM Categories WHERE Slug = 'fiat' AND IsDeleted = 0
    IF @parentId_1AC5C8959D154CACBC193A018D177BED IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('1AC5C895-9D15-4CAC-BC19-3A018D177BED', N'Tipo II', 'fiat-tipo-ii', @parentId_1AC5C8959D154CACBC193A018D177BED, NULL, NULL, 11, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'fiat-bravo-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_C344BE4DE61C43CD8C9B8A8C2DCC71FC uniqueidentifier
    SELECT @parentId_C344BE4DE61C43CD8C9B8A8C2DCC71FC = Id FROM Categories WHERE Slug = 'fiat' AND IsDeleted = 0
    IF @parentId_C344BE4DE61C43CD8C9B8A8C2DCC71FC IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('C344BE4D-E61C-43CD-8C9B-8A8C2DCC71FC', N'Bravo II', 'fiat-bravo-ii', @parentId_C344BE4DE61C43CD8C9B8A8C2DCC71FC, NULL, NULL, 12, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'fiat-stilo' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_F111924DD6974D3392DB15193BCCACDE uniqueidentifier
    SELECT @parentId_F111924DD6974D3392DB15193BCCACDE = Id FROM Categories WHERE Slug = 'fiat' AND IsDeleted = 0
    IF @parentId_F111924DD6974D3392DB15193BCCACDE IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('F111924D-D697-4D33-92DB-15193BCCACDE', N'Stilo', 'fiat-stilo', @parentId_F111924DD6974D3392DB15193BCCACDE, NULL, NULL, 13, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'fiat-linea' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_5D51E5150BF74246AB66305FFC57E305 uniqueidentifier
    SELECT @parentId_5D51E5150BF74246AB66305FFC57E305 = Id FROM Categories WHERE Slug = 'fiat' AND IsDeleted = 0
    IF @parentId_5D51E5150BF74246AB66305FFC57E305 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('5D51E515-0BF7-4246-AB66-305FFC57E305', N'Linea', 'fiat-linea', @parentId_5D51E5150BF74246AB66305FFC57E305, NULL, NULL, 14, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'fiat-egea' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_70A7F9B88CEC45A28700BF46C68A9309 uniqueidentifier
    SELECT @parentId_70A7F9B88CEC45A28700BF46C68A9309 = Id FROM Categories WHERE Slug = 'fiat' AND IsDeleted = 0
    IF @parentId_70A7F9B88CEC45A28700BF46C68A9309 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('70A7F9B8-8CEC-45A2-8700-BF46C68A9309', N'Egea', 'fiat-egea', @parentId_70A7F9B88CEC45A28700BF46C68A9309, NULL, NULL, 15, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'fiat-500x' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_BA3E930AE32C46E4B087AAC9B3023A4C uniqueidentifier
    SELECT @parentId_BA3E930AE32C46E4B087AAC9B3023A4C = Id FROM Categories WHERE Slug = 'fiat' AND IsDeleted = 0
    IF @parentId_BA3E930AE32C46E4B087AAC9B3023A4C IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('BA3E930A-E32C-46E4-B087-AAC9B3023A4C', N'500X', 'fiat-500x', @parentId_BA3E930AE32C46E4B087AAC9B3023A4C, NULL, NULL, 16, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'fiat-panda-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_A75F2036695C4CF0900203A4AA7314CD uniqueidentifier
    SELECT @parentId_A75F2036695C4CF0900203A4AA7314CD = Id FROM Categories WHERE Slug = 'fiat' AND IsDeleted = 0
    IF @parentId_A75F2036695C4CF0900203A4AA7314CD IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('A75F2036-695C-4CF0-9002-03A4AA7314CD', N'Panda II', 'fiat-panda-ii', @parentId_A75F2036695C4CF0900203A4AA7314CD, NULL, NULL, 17, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'fiat-panda-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_FF103DB8C9C54FDBAA56518E8911C35D uniqueidentifier
    SELECT @parentId_FF103DB8C9C54FDBAA56518E8911C35D = Id FROM Categories WHERE Slug = 'fiat' AND IsDeleted = 0
    IF @parentId_FF103DB8C9C54FDBAA56518E8911C35D IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('FF103DB8-C9C5-4FDB-AA56-518E8911C35D', N'Panda III', 'fiat-panda-iii', @parentId_FF103DB8C9C54FDBAA56518E8911C35D, NULL, NULL, 18, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'fiat-uno-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_F716C024B84F41ECA48859C775E33988 uniqueidentifier
    SELECT @parentId_F716C024B84F41ECA48859C775E33988 = Id FROM Categories WHERE Slug = 'fiat' AND IsDeleted = 0
    IF @parentId_F716C024B84F41ECA48859C775E33988 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('F716C024-B84F-41EC-A488-59C775E33988', N'Uno II', 'fiat-uno-ii', @parentId_F716C024B84F41ECA48859C775E33988, NULL, NULL, 19, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'toyota' AND IsDeleted = 0)
BEGIN
    INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
    VALUES ('28BECAE8-0CFF-4A19-8D87-013B0D63A028', N'Toyota', 'toyota', NULL, NULL, NULL, 13, 1, 1, 1, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
ELSE
BEGIN
    -- Varsa ShowInVehicleNav=true gÃ¼ncelle
    UPDATE Categories SET ShowInVehicleNav = 1 WHERE Slug = 'toyota' AND IsDeleted = 0
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'toyota-corolla-e10' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_AE7950381B644EC098135BA8BFEE2D52 uniqueidentifier
    SELECT @parentId_AE7950381B644EC098135BA8BFEE2D52 = Id FROM Categories WHERE Slug = 'toyota' AND IsDeleted = 0
    IF @parentId_AE7950381B644EC098135BA8BFEE2D52 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('AE795038-1B64-4EC0-9813-5BA8BFEE2D52', N'Corolla E10', 'toyota-corolla-e10', @parentId_AE7950381B644EC098135BA8BFEE2D52, NULL, NULL, 0, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'toyota-corolla-e11' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_B5C92F318E5E4D78AEC7B0184BBF959E uniqueidentifier
    SELECT @parentId_B5C92F318E5E4D78AEC7B0184BBF959E = Id FROM Categories WHERE Slug = 'toyota' AND IsDeleted = 0
    IF @parentId_B5C92F318E5E4D78AEC7B0184BBF959E IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('B5C92F31-8E5E-4D78-AEC7-B0184BBF959E', N'Corolla E11', 'toyota-corolla-e11', @parentId_B5C92F318E5E4D78AEC7B0184BBF959E, NULL, NULL, 1, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'toyota-corolla-e12' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_04F7797C92804D84A29C74B509A48D2F uniqueidentifier
    SELECT @parentId_04F7797C92804D84A29C74B509A48D2F = Id FROM Categories WHERE Slug = 'toyota' AND IsDeleted = 0
    IF @parentId_04F7797C92804D84A29C74B509A48D2F IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('04F7797C-9280-4D84-A29C-74B509A48D2F', N'Corolla E12', 'toyota-corolla-e12', @parentId_04F7797C92804D84A29C74B509A48D2F, NULL, NULL, 2, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'toyota-corolla-e15' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_7F7BF4C6E1BE4C028D2611C2694F9F2C uniqueidentifier
    SELECT @parentId_7F7BF4C6E1BE4C028D2611C2694F9F2C = Id FROM Categories WHERE Slug = 'toyota' AND IsDeleted = 0
    IF @parentId_7F7BF4C6E1BE4C028D2611C2694F9F2C IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('7F7BF4C6-E1BE-4C02-8D26-11C2694F9F2C', N'Corolla E15', 'toyota-corolla-e15', @parentId_7F7BF4C6E1BE4C028D2611C2694F9F2C, NULL, NULL, 3, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'toyota-corolla-e16' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_9F2C6ECA01D742B39F85539905675D7F uniqueidentifier
    SELECT @parentId_9F2C6ECA01D742B39F85539905675D7F = Id FROM Categories WHERE Slug = 'toyota' AND IsDeleted = 0
    IF @parentId_9F2C6ECA01D742B39F85539905675D7F IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('9F2C6ECA-01D7-42B3-9F85-539905675D7F', N'Corolla E16', 'toyota-corolla-e16', @parentId_9F2C6ECA01D742B39F85539905675D7F, NULL, NULL, 4, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'toyota-corolla-e21' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_367BC810CE474D1A9D93BFCF850206DD uniqueidentifier
    SELECT @parentId_367BC810CE474D1A9D93BFCF850206DD = Id FROM Categories WHERE Slug = 'toyota' AND IsDeleted = 0
    IF @parentId_367BC810CE474D1A9D93BFCF850206DD IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('367BC810-CE47-4D1A-9D93-BFCF850206DD', N'Corolla E21', 'toyota-corolla-e21', @parentId_367BC810CE474D1A9D93BFCF850206DD, NULL, NULL, 5, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'toyota-yaris-p1' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_43F519364EBD491EB8E04EAB5C80AE93 uniqueidentifier
    SELECT @parentId_43F519364EBD491EB8E04EAB5C80AE93 = Id FROM Categories WHERE Slug = 'toyota' AND IsDeleted = 0
    IF @parentId_43F519364EBD491EB8E04EAB5C80AE93 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('43F51936-4EBD-491E-B8E0-4EAB5C80AE93', N'Yaris P1', 'toyota-yaris-p1', @parentId_43F519364EBD491EB8E04EAB5C80AE93, NULL, NULL, 6, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'toyota-yaris-p2' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_8A940996F59545E0A12D2037D4DC61A3 uniqueidentifier
    SELECT @parentId_8A940996F59545E0A12D2037D4DC61A3 = Id FROM Categories WHERE Slug = 'toyota' AND IsDeleted = 0
    IF @parentId_8A940996F59545E0A12D2037D4DC61A3 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('8A940996-F595-45E0-A12D-2037D4DC61A3', N'Yaris P2', 'toyota-yaris-p2', @parentId_8A940996F59545E0A12D2037D4DC61A3, NULL, NULL, 7, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'toyota-yaris-p3' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_49B1F5DAE90045829084D7FBB4D9FEEF uniqueidentifier
    SELECT @parentId_49B1F5DAE90045829084D7FBB4D9FEEF = Id FROM Categories WHERE Slug = 'toyota' AND IsDeleted = 0
    IF @parentId_49B1F5DAE90045829084D7FBB4D9FEEF IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('49B1F5DA-E900-4582-9084-D7FBB4D9FEEF', N'Yaris P3', 'toyota-yaris-p3', @parentId_49B1F5DAE90045829084D7FBB4D9FEEF, NULL, NULL, 8, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'toyota-yaris-p4' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_3B678A855DAA46E1B2E6BB7A6BD91C0E uniqueidentifier
    SELECT @parentId_3B678A855DAA46E1B2E6BB7A6BD91C0E = Id FROM Categories WHERE Slug = 'toyota' AND IsDeleted = 0
    IF @parentId_3B678A855DAA46E1B2E6BB7A6BD91C0E IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('3B678A85-5DAA-46E1-B2E6-BB7A6BD91C0E', N'Yaris P4', 'toyota-yaris-p4', @parentId_3B678A855DAA46E1B2E6BB7A6BD91C0E, NULL, NULL, 9, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'toyota-auris-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_EC2BA27A9ED34857B6D440559E4C99E1 uniqueidentifier
    SELECT @parentId_EC2BA27A9ED34857B6D440559E4C99E1 = Id FROM Categories WHERE Slug = 'toyota' AND IsDeleted = 0
    IF @parentId_EC2BA27A9ED34857B6D440559E4C99E1 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('EC2BA27A-9ED3-4857-B6D4-40559E4C99E1', N'Auris I', 'toyota-auris-i', @parentId_EC2BA27A9ED34857B6D440559E4C99E1, NULL, NULL, 10, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'toyota-auris-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_DBF907CD01AD4E9C97DCFAB0BEBA7570 uniqueidentifier
    SELECT @parentId_DBF907CD01AD4E9C97DCFAB0BEBA7570 = Id FROM Categories WHERE Slug = 'toyota' AND IsDeleted = 0
    IF @parentId_DBF907CD01AD4E9C97DCFAB0BEBA7570 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('DBF907CD-01AD-4E9C-97DC-FAB0BEBA7570', N'Auris II', 'toyota-auris-ii', @parentId_DBF907CD01AD4E9C97DCFAB0BEBA7570, NULL, NULL, 11, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'toyota-avensis-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_6530E3CAD508469CB77AC85F0E5109EE uniqueidentifier
    SELECT @parentId_6530E3CAD508469CB77AC85F0E5109EE = Id FROM Categories WHERE Slug = 'toyota' AND IsDeleted = 0
    IF @parentId_6530E3CAD508469CB77AC85F0E5109EE IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('6530E3CA-D508-469C-B77A-C85F0E5109EE', N'Avensis I', 'toyota-avensis-i', @parentId_6530E3CAD508469CB77AC85F0E5109EE, NULL, NULL, 12, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'toyota-avensis-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_CF10654EA01A494CB7F708CF4C75189D uniqueidentifier
    SELECT @parentId_CF10654EA01A494CB7F708CF4C75189D = Id FROM Categories WHERE Slug = 'toyota' AND IsDeleted = 0
    IF @parentId_CF10654EA01A494CB7F708CF4C75189D IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('CF10654E-A01A-494C-B7F7-08CF4C75189D', N'Avensis II', 'toyota-avensis-ii', @parentId_CF10654EA01A494CB7F708CF4C75189D, NULL, NULL, 13, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'toyota-avensis-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_7F3859B6E8134454BEEF7AFC8B03EB1D uniqueidentifier
    SELECT @parentId_7F3859B6E8134454BEEF7AFC8B03EB1D = Id FROM Categories WHERE Slug = 'toyota' AND IsDeleted = 0
    IF @parentId_7F3859B6E8134454BEEF7AFC8B03EB1D IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('7F3859B6-E813-4454-BEEF-7AFC8B03EB1D', N'Avensis III', 'toyota-avensis-iii', @parentId_7F3859B6E8134454BEEF7AFC8B03EB1D, NULL, NULL, 14, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'toyota-rav4-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_6781C013E9454EEA8777DB8B21EAB45F uniqueidentifier
    SELECT @parentId_6781C013E9454EEA8777DB8B21EAB45F = Id FROM Categories WHERE Slug = 'toyota' AND IsDeleted = 0
    IF @parentId_6781C013E9454EEA8777DB8B21EAB45F IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('6781C013-E945-4EEA-8777-DB8B21EAB45F', N'RAV4 I', 'toyota-rav4-i', @parentId_6781C013E9454EEA8777DB8B21EAB45F, NULL, NULL, 15, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'toyota-rav4-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_A5A7A254297B445E86AC237F0BDCDE26 uniqueidentifier
    SELECT @parentId_A5A7A254297B445E86AC237F0BDCDE26 = Id FROM Categories WHERE Slug = 'toyota' AND IsDeleted = 0
    IF @parentId_A5A7A254297B445E86AC237F0BDCDE26 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('A5A7A254-297B-445E-86AC-237F0BDCDE26', N'RAV4 II', 'toyota-rav4-ii', @parentId_A5A7A254297B445E86AC237F0BDCDE26, NULL, NULL, 16, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'toyota-rav4-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_98F5DF2E253D4942A475F488E9ABCE66 uniqueidentifier
    SELECT @parentId_98F5DF2E253D4942A475F488E9ABCE66 = Id FROM Categories WHERE Slug = 'toyota' AND IsDeleted = 0
    IF @parentId_98F5DF2E253D4942A475F488E9ABCE66 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('98F5DF2E-253D-4942-A475-F488E9ABCE66', N'RAV4 III', 'toyota-rav4-iii', @parentId_98F5DF2E253D4942A475F488E9ABCE66, NULL, NULL, 17, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'toyota-rav4-iv' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_7C2E28EEFC4E439697B305D3D4FC1BF1 uniqueidentifier
    SELECT @parentId_7C2E28EEFC4E439697B305D3D4FC1BF1 = Id FROM Categories WHERE Slug = 'toyota' AND IsDeleted = 0
    IF @parentId_7C2E28EEFC4E439697B305D3D4FC1BF1 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('7C2E28EE-FC4E-4396-97B3-05D3D4FC1BF1', N'RAV4 IV', 'toyota-rav4-iv', @parentId_7C2E28EEFC4E439697B305D3D4FC1BF1, NULL, NULL, 18, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'toyota-rav4-v' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_79C70C76A30642E0A628A6F0F77EB850 uniqueidentifier
    SELECT @parentId_79C70C76A30642E0A628A6F0F77EB850 = Id FROM Categories WHERE Slug = 'toyota' AND IsDeleted = 0
    IF @parentId_79C70C76A30642E0A628A6F0F77EB850 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('79C70C76-A306-42E0-A628-A6F0F77EB850', N'RAV4 V', 'toyota-rav4-v', @parentId_79C70C76A30642E0A628A6F0F77EB850, NULL, NULL, 19, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'toyota-land-cruiser-j100' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_E5BAE63059894486AE8A36B3B59AD00B uniqueidentifier
    SELECT @parentId_E5BAE63059894486AE8A36B3B59AD00B = Id FROM Categories WHERE Slug = 'toyota' AND IsDeleted = 0
    IF @parentId_E5BAE63059894486AE8A36B3B59AD00B IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('E5BAE630-5989-4486-AE8A-36B3B59AD00B', N'Land Cruiser J100', 'toyota-land-cruiser-j100', @parentId_E5BAE63059894486AE8A36B3B59AD00B, NULL, NULL, 20, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'toyota-land-cruiser-j150' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_5B50A7EC80CF4715991C87EB6257F6C0 uniqueidentifier
    SELECT @parentId_5B50A7EC80CF4715991C87EB6257F6C0 = Id FROM Categories WHERE Slug = 'toyota' AND IsDeleted = 0
    IF @parentId_5B50A7EC80CF4715991C87EB6257F6C0 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('5B50A7EC-80CF-4715-991C-87EB6257F6C0', N'Land Cruiser J150', 'toyota-land-cruiser-j150', @parentId_5B50A7EC80CF4715991C87EB6257F6C0, NULL, NULL, 21, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'toyota-land-cruiser-j200' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_D9D632D3DA544AD0BCEB21B82FF8F215 uniqueidentifier
    SELECT @parentId_D9D632D3DA544AD0BCEB21B82FF8F215 = Id FROM Categories WHERE Slug = 'toyota' AND IsDeleted = 0
    IF @parentId_D9D632D3DA544AD0BCEB21B82FF8F215 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('D9D632D3-DA54-4AD0-BCEB-21B82FF8F215', N'Land Cruiser J200', 'toyota-land-cruiser-j200', @parentId_D9D632D3DA544AD0BCEB21B82FF8F215, NULL, NULL, 22, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'toyota-land-cruiser-j300' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_FC0B0652E7674DFF9B68552BC5D2ED69 uniqueidentifier
    SELECT @parentId_FC0B0652E7674DFF9B68552BC5D2ED69 = Id FROM Categories WHERE Slug = 'toyota' AND IsDeleted = 0
    IF @parentId_FC0B0652E7674DFF9B68552BC5D2ED69 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('FC0B0652-E767-4DFF-9B68-552BC5D2ED69', N'Land Cruiser J300', 'toyota-land-cruiser-j300', @parentId_FC0B0652E7674DFF9B68552BC5D2ED69, NULL, NULL, 23, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'toyota-hilux-vii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_6C31796729F6424389CE6BF105485925 uniqueidentifier
    SELECT @parentId_6C31796729F6424389CE6BF105485925 = Id FROM Categories WHERE Slug = 'toyota' AND IsDeleted = 0
    IF @parentId_6C31796729F6424389CE6BF105485925 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('6C317967-29F6-4243-89CE-6BF105485925', N'Hilux VII', 'toyota-hilux-vii', @parentId_6C31796729F6424389CE6BF105485925, NULL, NULL, 24, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'toyota-hilux-viii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_BBCF29F6EE424EB4B70166951B411D2A uniqueidentifier
    SELECT @parentId_BBCF29F6EE424EB4B70166951B411D2A = Id FROM Categories WHERE Slug = 'toyota' AND IsDeleted = 0
    IF @parentId_BBCF29F6EE424EB4B70166951B411D2A IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('BBCF29F6-EE42-4EB4-B701-66951B411D2A', N'Hilux VIII', 'toyota-hilux-viii', @parentId_BBCF29F6EE424EB4B70166951B411D2A, NULL, NULL, 25, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'toyota-prius-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_A438C1CDC0314F1B9C05667355B4C205 uniqueidentifier
    SELECT @parentId_A438C1CDC0314F1B9C05667355B4C205 = Id FROM Categories WHERE Slug = 'toyota' AND IsDeleted = 0
    IF @parentId_A438C1CDC0314F1B9C05667355B4C205 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('A438C1CD-C031-4F1B-9C05-667355B4C205', N'Prius II', 'toyota-prius-ii', @parentId_A438C1CDC0314F1B9C05667355B4C205, NULL, NULL, 26, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'toyota-prius-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_30834886E61D430DA62CAB9A51D9A979 uniqueidentifier
    SELECT @parentId_30834886E61D430DA62CAB9A51D9A979 = Id FROM Categories WHERE Slug = 'toyota' AND IsDeleted = 0
    IF @parentId_30834886E61D430DA62CAB9A51D9A979 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('30834886-E61D-430D-A62C-AB9A51D9A979', N'Prius III', 'toyota-prius-iii', @parentId_30834886E61D430DA62CAB9A51D9A979, NULL, NULL, 27, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'toyota-prius-iv' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_67557EC5E2854CB3807ACB49D4C5F702 uniqueidentifier
    SELECT @parentId_67557EC5E2854CB3807ACB49D4C5F702 = Id FROM Categories WHERE Slug = 'toyota' AND IsDeleted = 0
    IF @parentId_67557EC5E2854CB3807ACB49D4C5F702 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('67557EC5-E285-4CB3-807A-CB49D4C5F702', N'Prius IV', 'toyota-prius-iv', @parentId_67557EC5E2854CB3807ACB49D4C5F702, NULL, NULL, 28, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'toyota-c-hr' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_98741DF8C81B47F0B3A9C99B91385A13 uniqueidentifier
    SELECT @parentId_98741DF8C81B47F0B3A9C99B91385A13 = Id FROM Categories WHERE Slug = 'toyota' AND IsDeleted = 0
    IF @parentId_98741DF8C81B47F0B3A9C99B91385A13 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('98741DF8-C81B-47F0-B3A9-C99B91385A13', N'C-HR', 'toyota-c-hr', @parentId_98741DF8C81B47F0B3A9C99B91385A13, NULL, NULL, 29, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'toyota-camry-vii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_AC503FDC35074E90977576329AFEEFF5 uniqueidentifier
    SELECT @parentId_AC503FDC35074E90977576329AFEEFF5 = Id FROM Categories WHERE Slug = 'toyota' AND IsDeleted = 0
    IF @parentId_AC503FDC35074E90977576329AFEEFF5 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('AC503FDC-3507-4E90-9775-76329AFEEFF5', N'Camry VII', 'toyota-camry-vii', @parentId_AC503FDC35074E90977576329AFEEFF5, NULL, NULL, 30, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'toyota-camry-viii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_FC42EEC740444AB3B78BA03E6F9BB7DA uniqueidentifier
    SELECT @parentId_FC42EEC740444AB3B78BA03E6F9BB7DA = Id FROM Categories WHERE Slug = 'toyota' AND IsDeleted = 0
    IF @parentId_FC42EEC740444AB3B78BA03E6F9BB7DA IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('FC42EEC7-4044-4AB3-B78B-A03E6F9BB7DA', N'Camry VIII', 'toyota-camry-viii', @parentId_FC42EEC740444AB3B78BA03E6F9BB7DA, NULL, NULL, 31, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'toyota-aygo-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_B9B67766284F40C39A1CF95C32D13D27 uniqueidentifier
    SELECT @parentId_B9B67766284F40C39A1CF95C32D13D27 = Id FROM Categories WHERE Slug = 'toyota' AND IsDeleted = 0
    IF @parentId_B9B67766284F40C39A1CF95C32D13D27 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('B9B67766-284F-40C3-9A1C-F95C32D13D27', N'Aygo I', 'toyota-aygo-i', @parentId_B9B67766284F40C39A1CF95C32D13D27, NULL, NULL, 32, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'toyota-aygo-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_896770E2636A4786873C7C739DB7C134 uniqueidentifier
    SELECT @parentId_896770E2636A4786873C7C739DB7C134 = Id FROM Categories WHERE Slug = 'toyota' AND IsDeleted = 0
    IF @parentId_896770E2636A4786873C7C739DB7C134 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('896770E2-636A-4786-873C-7C739DB7C134', N'Aygo II', 'toyota-aygo-ii', @parentId_896770E2636A4786873C7C739DB7C134, NULL, NULL, 33, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'hyundai' AND IsDeleted = 0)
BEGIN
    INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
    VALUES ('6127D6FC-111C-4683-8FFD-2221FF3551D6', N'Hyundai', 'hyundai', NULL, NULL, NULL, 14, 1, 1, 1, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
ELSE
BEGIN
    -- Varsa ShowInVehicleNav=true gÃ¼ncelle
    UPDATE Categories SET ShowInVehicleNav = 1 WHERE Slug = 'hyundai' AND IsDeleted = 0
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'hyundai-i10-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_CBE7D33647074756AF1207F7D3B29526 uniqueidentifier
    SELECT @parentId_CBE7D33647074756AF1207F7D3B29526 = Id FROM Categories WHERE Slug = 'hyundai' AND IsDeleted = 0
    IF @parentId_CBE7D33647074756AF1207F7D3B29526 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('CBE7D336-4707-4756-AF12-07F7D3B29526', N'i10 I', 'hyundai-i10-i', @parentId_CBE7D33647074756AF1207F7D3B29526, NULL, NULL, 0, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'hyundai-i10-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_0D13F71FDD3E45F4ABF647B2B5276F5A uniqueidentifier
    SELECT @parentId_0D13F71FDD3E45F4ABF647B2B5276F5A = Id FROM Categories WHERE Slug = 'hyundai' AND IsDeleted = 0
    IF @parentId_0D13F71FDD3E45F4ABF647B2B5276F5A IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('0D13F71F-DD3E-45F4-ABF6-47B2B5276F5A', N'i10 II', 'hyundai-i10-ii', @parentId_0D13F71FDD3E45F4ABF647B2B5276F5A, NULL, NULL, 1, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'hyundai-i10-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_605544AC1DB743E5B22D9222A0B1DD46 uniqueidentifier
    SELECT @parentId_605544AC1DB743E5B22D9222A0B1DD46 = Id FROM Categories WHERE Slug = 'hyundai' AND IsDeleted = 0
    IF @parentId_605544AC1DB743E5B22D9222A0B1DD46 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('605544AC-1DB7-43E5-B22D-9222A0B1DD46', N'i10 III', 'hyundai-i10-iii', @parentId_605544AC1DB743E5B22D9222A0B1DD46, NULL, NULL, 2, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'hyundai-i20-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_B1E884A3011944FAAA7FE71F177F716F uniqueidentifier
    SELECT @parentId_B1E884A3011944FAAA7FE71F177F716F = Id FROM Categories WHERE Slug = 'hyundai' AND IsDeleted = 0
    IF @parentId_B1E884A3011944FAAA7FE71F177F716F IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('B1E884A3-0119-44FA-AA7F-E71F177F716F', N'i20 I', 'hyundai-i20-i', @parentId_B1E884A3011944FAAA7FE71F177F716F, NULL, NULL, 3, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'hyundai-i20-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_217DF620FDE14CDF8595DA8B88A0FD0C uniqueidentifier
    SELECT @parentId_217DF620FDE14CDF8595DA8B88A0FD0C = Id FROM Categories WHERE Slug = 'hyundai' AND IsDeleted = 0
    IF @parentId_217DF620FDE14CDF8595DA8B88A0FD0C IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('217DF620-FDE1-4CDF-8595-DA8B88A0FD0C', N'i20 II', 'hyundai-i20-ii', @parentId_217DF620FDE14CDF8595DA8B88A0FD0C, NULL, NULL, 4, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'hyundai-i20-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_04B5D3D5539B476895E54736C2FB0A49 uniqueidentifier
    SELECT @parentId_04B5D3D5539B476895E54736C2FB0A49 = Id FROM Categories WHERE Slug = 'hyundai' AND IsDeleted = 0
    IF @parentId_04B5D3D5539B476895E54736C2FB0A49 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('04B5D3D5-539B-4768-95E5-4736C2FB0A49', N'i20 III', 'hyundai-i20-iii', @parentId_04B5D3D5539B476895E54736C2FB0A49, NULL, NULL, 5, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'hyundai-i30-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_AECE590FA0304743B35A11FE9BF3C258 uniqueidentifier
    SELECT @parentId_AECE590FA0304743B35A11FE9BF3C258 = Id FROM Categories WHERE Slug = 'hyundai' AND IsDeleted = 0
    IF @parentId_AECE590FA0304743B35A11FE9BF3C258 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('AECE590F-A030-4743-B35A-11FE9BF3C258', N'i30 I', 'hyundai-i30-i', @parentId_AECE590FA0304743B35A11FE9BF3C258, NULL, NULL, 6, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'hyundai-i30-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_3873B1B59E5B41C291A165CFC1D7C8E1 uniqueidentifier
    SELECT @parentId_3873B1B59E5B41C291A165CFC1D7C8E1 = Id FROM Categories WHERE Slug = 'hyundai' AND IsDeleted = 0
    IF @parentId_3873B1B59E5B41C291A165CFC1D7C8E1 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('3873B1B5-9E5B-41C2-91A1-65CFC1D7C8E1', N'i30 II', 'hyundai-i30-ii', @parentId_3873B1B59E5B41C291A165CFC1D7C8E1, NULL, NULL, 7, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'hyundai-i30-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_B8E09F40736B47A3BFDA4583FC90CF77 uniqueidentifier
    SELECT @parentId_B8E09F40736B47A3BFDA4583FC90CF77 = Id FROM Categories WHERE Slug = 'hyundai' AND IsDeleted = 0
    IF @parentId_B8E09F40736B47A3BFDA4583FC90CF77 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('B8E09F40-736B-47A3-BFDA-4583FC90CF77', N'i30 III', 'hyundai-i30-iii', @parentId_B8E09F40736B47A3BFDA4583FC90CF77, NULL, NULL, 8, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'hyundai-i40-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_912FA547EC9B4EA589E3690F075993E7 uniqueidentifier
    SELECT @parentId_912FA547EC9B4EA589E3690F075993E7 = Id FROM Categories WHERE Slug = 'hyundai' AND IsDeleted = 0
    IF @parentId_912FA547EC9B4EA589E3690F075993E7 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('912FA547-EC9B-4EA5-89E3-690F075993E7', N'i40 I', 'hyundai-i40-i', @parentId_912FA547EC9B4EA589E3690F075993E7, NULL, NULL, 9, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'hyundai-accent-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_508D2F92A8F74E38B08C8F1FE5B8A7B4 uniqueidentifier
    SELECT @parentId_508D2F92A8F74E38B08C8F1FE5B8A7B4 = Id FROM Categories WHERE Slug = 'hyundai' AND IsDeleted = 0
    IF @parentId_508D2F92A8F74E38B08C8F1FE5B8A7B4 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('508D2F92-A8F7-4E38-B08C-8F1FE5B8A7B4', N'Accent III', 'hyundai-accent-iii', @parentId_508D2F92A8F74E38B08C8F1FE5B8A7B4, NULL, NULL, 10, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'hyundai-accent-iv' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_11867E7B4A00429C9D87603EBDDBF793 uniqueidentifier
    SELECT @parentId_11867E7B4A00429C9D87603EBDDBF793 = Id FROM Categories WHERE Slug = 'hyundai' AND IsDeleted = 0
    IF @parentId_11867E7B4A00429C9D87603EBDDBF793 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('11867E7B-4A00-429C-9D87-603EBDDBF793', N'Accent IV', 'hyundai-accent-iv', @parentId_11867E7B4A00429C9D87603EBDDBF793, NULL, NULL, 11, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'hyundai-elantra-iv' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_A3ABE22AD9334326BFC9AD051AEFE716 uniqueidentifier
    SELECT @parentId_A3ABE22AD9334326BFC9AD051AEFE716 = Id FROM Categories WHERE Slug = 'hyundai' AND IsDeleted = 0
    IF @parentId_A3ABE22AD9334326BFC9AD051AEFE716 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('A3ABE22A-D933-4326-BFC9-AD051AEFE716', N'Elantra IV', 'hyundai-elantra-iv', @parentId_A3ABE22AD9334326BFC9AD051AEFE716, NULL, NULL, 12, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'hyundai-elantra-v' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_E5892E9A111349B4AA6AE4A1B7C32787 uniqueidentifier
    SELECT @parentId_E5892E9A111349B4AA6AE4A1B7C32787 = Id FROM Categories WHERE Slug = 'hyundai' AND IsDeleted = 0
    IF @parentId_E5892E9A111349B4AA6AE4A1B7C32787 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('E5892E9A-1113-49B4-AA6A-E4A1B7C32787', N'Elantra V', 'hyundai-elantra-v', @parentId_E5892E9A111349B4AA6AE4A1B7C32787, NULL, NULL, 13, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'hyundai-elantra-vi' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_DFC691BBDEE84727AC55617761F161C2 uniqueidentifier
    SELECT @parentId_DFC691BBDEE84727AC55617761F161C2 = Id FROM Categories WHERE Slug = 'hyundai' AND IsDeleted = 0
    IF @parentId_DFC691BBDEE84727AC55617761F161C2 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('DFC691BB-DEE8-4727-AC55-617761F161C2', N'Elantra VI', 'hyundai-elantra-vi', @parentId_DFC691BBDEE84727AC55617761F161C2, NULL, NULL, 14, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'hyundai-sonata-iv' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_FF2D4E219B284ABFBFD7C067070D157A uniqueidentifier
    SELECT @parentId_FF2D4E219B284ABFBFD7C067070D157A = Id FROM Categories WHERE Slug = 'hyundai' AND IsDeleted = 0
    IF @parentId_FF2D4E219B284ABFBFD7C067070D157A IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('FF2D4E21-9B28-4ABF-BFD7-C067070D157A', N'Sonata IV', 'hyundai-sonata-iv', @parentId_FF2D4E219B284ABFBFD7C067070D157A, NULL, NULL, 15, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'hyundai-sonata-v' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_8E63601AEAAF462CA14668A3414BE0B7 uniqueidentifier
    SELECT @parentId_8E63601AEAAF462CA14668A3414BE0B7 = Id FROM Categories WHERE Slug = 'hyundai' AND IsDeleted = 0
    IF @parentId_8E63601AEAAF462CA14668A3414BE0B7 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('8E63601A-EAAF-462C-A146-68A3414BE0B7', N'Sonata V', 'hyundai-sonata-v', @parentId_8E63601AEAAF462CA14668A3414BE0B7, NULL, NULL, 16, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'hyundai-tucson-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_653F27FA3AA3417D9658528C78A67ECA uniqueidentifier
    SELECT @parentId_653F27FA3AA3417D9658528C78A67ECA = Id FROM Categories WHERE Slug = 'hyundai' AND IsDeleted = 0
    IF @parentId_653F27FA3AA3417D9658528C78A67ECA IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('653F27FA-3AA3-417D-9658-528C78A67ECA', N'Tucson I', 'hyundai-tucson-i', @parentId_653F27FA3AA3417D9658528C78A67ECA, NULL, NULL, 17, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'hyundai-tucson-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_EF1821BCA3A648978FDC373DEB3C3470 uniqueidentifier
    SELECT @parentId_EF1821BCA3A648978FDC373DEB3C3470 = Id FROM Categories WHERE Slug = 'hyundai' AND IsDeleted = 0
    IF @parentId_EF1821BCA3A648978FDC373DEB3C3470 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('EF1821BC-A3A6-4897-8FDC-373DEB3C3470', N'Tucson II', 'hyundai-tucson-ii', @parentId_EF1821BCA3A648978FDC373DEB3C3470, NULL, NULL, 18, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'hyundai-tucson-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_B994EBC817264CDF964185259D4B69F4 uniqueidentifier
    SELECT @parentId_B994EBC817264CDF964185259D4B69F4 = Id FROM Categories WHERE Slug = 'hyundai' AND IsDeleted = 0
    IF @parentId_B994EBC817264CDF964185259D4B69F4 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('B994EBC8-1726-4CDF-9641-85259D4B69F4', N'Tucson III', 'hyundai-tucson-iii', @parentId_B994EBC817264CDF964185259D4B69F4, NULL, NULL, 19, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'hyundai-tucson-iv' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_0003E4DB59D14D89B0BF647ADF18CCF0 uniqueidentifier
    SELECT @parentId_0003E4DB59D14D89B0BF647ADF18CCF0 = Id FROM Categories WHERE Slug = 'hyundai' AND IsDeleted = 0
    IF @parentId_0003E4DB59D14D89B0BF647ADF18CCF0 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('0003E4DB-59D1-4D89-B0BF-647ADF18CCF0', N'Tucson IV', 'hyundai-tucson-iv', @parentId_0003E4DB59D14D89B0BF647ADF18CCF0, NULL, NULL, 20, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'hyundai-santa-fe-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_D7B8C4F9C94642DA96A4980389C9BC9A uniqueidentifier
    SELECT @parentId_D7B8C4F9C94642DA96A4980389C9BC9A = Id FROM Categories WHERE Slug = 'hyundai' AND IsDeleted = 0
    IF @parentId_D7B8C4F9C94642DA96A4980389C9BC9A IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('D7B8C4F9-C946-42DA-96A4-980389C9BC9A', N'Santa Fe I', 'hyundai-santa-fe-i', @parentId_D7B8C4F9C94642DA96A4980389C9BC9A, NULL, NULL, 21, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'hyundai-santa-fe-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_47C2D94DB5DE4BB3920153C6AEFF9BF4 uniqueidentifier
    SELECT @parentId_47C2D94DB5DE4BB3920153C6AEFF9BF4 = Id FROM Categories WHERE Slug = 'hyundai' AND IsDeleted = 0
    IF @parentId_47C2D94DB5DE4BB3920153C6AEFF9BF4 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('47C2D94D-B5DE-4BB3-9201-53C6AEFF9BF4', N'Santa Fe II', 'hyundai-santa-fe-ii', @parentId_47C2D94DB5DE4BB3920153C6AEFF9BF4, NULL, NULL, 22, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'hyundai-santa-fe-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_B30B1679983E4A75816269EDE34043E7 uniqueidentifier
    SELECT @parentId_B30B1679983E4A75816269EDE34043E7 = Id FROM Categories WHERE Slug = 'hyundai' AND IsDeleted = 0
    IF @parentId_B30B1679983E4A75816269EDE34043E7 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('B30B1679-983E-4A75-8162-69EDE34043E7', N'Santa Fe III', 'hyundai-santa-fe-iii', @parentId_B30B1679983E4A75816269EDE34043E7, NULL, NULL, 23, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'hyundai-santa-fe-iv' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_86D6E52BC3C94CAD9DF1A6907194A049 uniqueidentifier
    SELECT @parentId_86D6E52BC3C94CAD9DF1A6907194A049 = Id FROM Categories WHERE Slug = 'hyundai' AND IsDeleted = 0
    IF @parentId_86D6E52BC3C94CAD9DF1A6907194A049 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('86D6E52B-C3C9-4CAD-9DF1-A6907194A049', N'Santa Fe IV', 'hyundai-santa-fe-iv', @parentId_86D6E52BC3C94CAD9DF1A6907194A049, NULL, NULL, 24, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'hyundai-ix35' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_125B0B6A8C104A3DB0DA9142F9ED8AA6 uniqueidentifier
    SELECT @parentId_125B0B6A8C104A3DB0DA9142F9ED8AA6 = Id FROM Categories WHERE Slug = 'hyundai' AND IsDeleted = 0
    IF @parentId_125B0B6A8C104A3DB0DA9142F9ED8AA6 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('125B0B6A-8C10-4A3D-B0DA-9142F9ED8AA6', N'ix35', 'hyundai-ix35', @parentId_125B0B6A8C104A3DB0DA9142F9ED8AA6, NULL, NULL, 25, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'hyundai-kona' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_F8F123F64D0244FF96ECF9AB6C7BE27C uniqueidentifier
    SELECT @parentId_F8F123F64D0244FF96ECF9AB6C7BE27C = Id FROM Categories WHERE Slug = 'hyundai' AND IsDeleted = 0
    IF @parentId_F8F123F64D0244FF96ECF9AB6C7BE27C IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('F8F123F6-4D02-44FF-96EC-F9AB6C7BE27C', N'Kona', 'hyundai-kona', @parentId_F8F123F64D0244FF96ECF9AB6C7BE27C, NULL, NULL, 26, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'hyundai-ioniq' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_422B68D96FD04E04B04302392D0387A8 uniqueidentifier
    SELECT @parentId_422B68D96FD04E04B04302392D0387A8 = Id FROM Categories WHERE Slug = 'hyundai' AND IsDeleted = 0
    IF @parentId_422B68D96FD04E04B04302392D0387A8 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('422B68D9-6FD0-4E04-B043-02392D0387A8', N'Ioniq', 'hyundai-ioniq', @parentId_422B68D96FD04E04B04302392D0387A8, NULL, NULL, 27, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'hyundai-h-1-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_BEB43D3580844651B974EBE73DAD9EEE uniqueidentifier
    SELECT @parentId_BEB43D3580844651B974EBE73DAD9EEE = Id FROM Categories WHERE Slug = 'hyundai' AND IsDeleted = 0
    IF @parentId_BEB43D3580844651B974EBE73DAD9EEE IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('BEB43D35-8084-4651-B974-EBE73DAD9EEE', N'H-1 II', 'hyundai-h-1-ii', @parentId_BEB43D3580844651B974EBE73DAD9EEE, NULL, NULL, 28, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'kia' AND IsDeleted = 0)
BEGIN
    INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
    VALUES ('2FE9EDCF-84DA-404D-AC41-85283D3D145C', N'Kia', 'kia', NULL, NULL, NULL, 15, 1, 1, 1, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
ELSE
BEGIN
    -- Varsa ShowInVehicleNav=true gÃ¼ncelle
    UPDATE Categories SET ShowInVehicleNav = 1 WHERE Slug = 'kia' AND IsDeleted = 0
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'kia-picanto-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_4EE8B8311C3F45C1B38477C85047D044 uniqueidentifier
    SELECT @parentId_4EE8B8311C3F45C1B38477C85047D044 = Id FROM Categories WHERE Slug = 'kia' AND IsDeleted = 0
    IF @parentId_4EE8B8311C3F45C1B38477C85047D044 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('4EE8B831-1C3F-45C1-B384-77C85047D044', N'Picanto I', 'kia-picanto-i', @parentId_4EE8B8311C3F45C1B38477C85047D044, NULL, NULL, 0, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'kia-picanto-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_01563E6107A04EF28D2DC30392BACB80 uniqueidentifier
    SELECT @parentId_01563E6107A04EF28D2DC30392BACB80 = Id FROM Categories WHERE Slug = 'kia' AND IsDeleted = 0
    IF @parentId_01563E6107A04EF28D2DC30392BACB80 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('01563E61-07A0-4EF2-8D2D-C30392BACB80', N'Picanto II', 'kia-picanto-ii', @parentId_01563E6107A04EF28D2DC30392BACB80, NULL, NULL, 1, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'kia-picanto-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_EA257C7D97BE457B8D382E5BEAE5CC3A uniqueidentifier
    SELECT @parentId_EA257C7D97BE457B8D382E5BEAE5CC3A = Id FROM Categories WHERE Slug = 'kia' AND IsDeleted = 0
    IF @parentId_EA257C7D97BE457B8D382E5BEAE5CC3A IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('EA257C7D-97BE-457B-8D38-2E5BEAE5CC3A', N'Picanto III', 'kia-picanto-iii', @parentId_EA257C7D97BE457B8D382E5BEAE5CC3A, NULL, NULL, 2, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'kia-rio-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_86B5A1C6B65F41EA9E7AAFB8876ED841 uniqueidentifier
    SELECT @parentId_86B5A1C6B65F41EA9E7AAFB8876ED841 = Id FROM Categories WHERE Slug = 'kia' AND IsDeleted = 0
    IF @parentId_86B5A1C6B65F41EA9E7AAFB8876ED841 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('86B5A1C6-B65F-41EA-9E7A-AFB8876ED841', N'Rio I', 'kia-rio-i', @parentId_86B5A1C6B65F41EA9E7AAFB8876ED841, NULL, NULL, 3, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'kia-rio-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_ED41EAAF2B8B4B5C928698DCBA7AE9CB uniqueidentifier
    SELECT @parentId_ED41EAAF2B8B4B5C928698DCBA7AE9CB = Id FROM Categories WHERE Slug = 'kia' AND IsDeleted = 0
    IF @parentId_ED41EAAF2B8B4B5C928698DCBA7AE9CB IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('ED41EAAF-2B8B-4B5C-9286-98DCBA7AE9CB', N'Rio II', 'kia-rio-ii', @parentId_ED41EAAF2B8B4B5C928698DCBA7AE9CB, NULL, NULL, 4, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'kia-rio-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_162D4BF403A841BEB85096BFBC4FDB31 uniqueidentifier
    SELECT @parentId_162D4BF403A841BEB85096BFBC4FDB31 = Id FROM Categories WHERE Slug = 'kia' AND IsDeleted = 0
    IF @parentId_162D4BF403A841BEB85096BFBC4FDB31 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('162D4BF4-03A8-41BE-B850-96BFBC4FDB31', N'Rio III', 'kia-rio-iii', @parentId_162D4BF403A841BEB85096BFBC4FDB31, NULL, NULL, 5, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'kia-rio-iv' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_2AFD0E23231646858F55806A3905188E uniqueidentifier
    SELECT @parentId_2AFD0E23231646858F55806A3905188E = Id FROM Categories WHERE Slug = 'kia' AND IsDeleted = 0
    IF @parentId_2AFD0E23231646858F55806A3905188E IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('2AFD0E23-2316-4685-8F55-806A3905188E', N'Rio IV', 'kia-rio-iv', @parentId_2AFD0E23231646858F55806A3905188E, NULL, NULL, 6, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'kia-ceed-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_3024D16930294889897972DE2EAAB072 uniqueidentifier
    SELECT @parentId_3024D16930294889897972DE2EAAB072 = Id FROM Categories WHERE Slug = 'kia' AND IsDeleted = 0
    IF @parentId_3024D16930294889897972DE2EAAB072 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('3024D169-3029-4889-8979-72DE2EAAB072', N'Ceed I', 'kia-ceed-i', @parentId_3024D16930294889897972DE2EAAB072, NULL, NULL, 7, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'kia-ceed-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_2A0E0525B9624F12AF7BAD183ECA3914 uniqueidentifier
    SELECT @parentId_2A0E0525B9624F12AF7BAD183ECA3914 = Id FROM Categories WHERE Slug = 'kia' AND IsDeleted = 0
    IF @parentId_2A0E0525B9624F12AF7BAD183ECA3914 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('2A0E0525-B962-4F12-AF7B-AD183ECA3914', N'Ceed II', 'kia-ceed-ii', @parentId_2A0E0525B9624F12AF7BAD183ECA3914, NULL, NULL, 8, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'kia-ceed-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_E80197CD51154218A54F62F3EF5CB7AA uniqueidentifier
    SELECT @parentId_E80197CD51154218A54F62F3EF5CB7AA = Id FROM Categories WHERE Slug = 'kia' AND IsDeleted = 0
    IF @parentId_E80197CD51154218A54F62F3EF5CB7AA IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('E80197CD-5115-4218-A54F-62F3EF5CB7AA', N'Ceed III', 'kia-ceed-iii', @parentId_E80197CD51154218A54F62F3EF5CB7AA, NULL, NULL, 9, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'kia-sportage-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_DC7175B0CE054274A16D17F60DB30397 uniqueidentifier
    SELECT @parentId_DC7175B0CE054274A16D17F60DB30397 = Id FROM Categories WHERE Slug = 'kia' AND IsDeleted = 0
    IF @parentId_DC7175B0CE054274A16D17F60DB30397 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('DC7175B0-CE05-4274-A16D-17F60DB30397', N'Sportage I', 'kia-sportage-i', @parentId_DC7175B0CE054274A16D17F60DB30397, NULL, NULL, 10, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'kia-sportage-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_6AE39254D45447A88923A404782E90A0 uniqueidentifier
    SELECT @parentId_6AE39254D45447A88923A404782E90A0 = Id FROM Categories WHERE Slug = 'kia' AND IsDeleted = 0
    IF @parentId_6AE39254D45447A88923A404782E90A0 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('6AE39254-D454-47A8-8923-A404782E90A0', N'Sportage II', 'kia-sportage-ii', @parentId_6AE39254D45447A88923A404782E90A0, NULL, NULL, 11, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'kia-sportage-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_919AFF873EC043BA8D203ADCB61F5862 uniqueidentifier
    SELECT @parentId_919AFF873EC043BA8D203ADCB61F5862 = Id FROM Categories WHERE Slug = 'kia' AND IsDeleted = 0
    IF @parentId_919AFF873EC043BA8D203ADCB61F5862 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('919AFF87-3EC0-43BA-8D20-3ADCB61F5862', N'Sportage III', 'kia-sportage-iii', @parentId_919AFF873EC043BA8D203ADCB61F5862, NULL, NULL, 12, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'kia-sportage-iv' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_9686B2AE7442446D8501ACCC3995F9B8 uniqueidentifier
    SELECT @parentId_9686B2AE7442446D8501ACCC3995F9B8 = Id FROM Categories WHERE Slug = 'kia' AND IsDeleted = 0
    IF @parentId_9686B2AE7442446D8501ACCC3995F9B8 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('9686B2AE-7442-446D-8501-ACCC3995F9B8', N'Sportage IV', 'kia-sportage-iv', @parentId_9686B2AE7442446D8501ACCC3995F9B8, NULL, NULL, 13, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'kia-sportage-v' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_BE658E65542D42A8B3B95276CD4C4902 uniqueidentifier
    SELECT @parentId_BE658E65542D42A8B3B95276CD4C4902 = Id FROM Categories WHERE Slug = 'kia' AND IsDeleted = 0
    IF @parentId_BE658E65542D42A8B3B95276CD4C4902 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('BE658E65-542D-42A8-B3B9-5276CD4C4902', N'Sportage V', 'kia-sportage-v', @parentId_BE658E65542D42A8B3B95276CD4C4902, NULL, NULL, 14, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'kia-sorento-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_F67CED896AA34CCF92492D5FFE566B2E uniqueidentifier
    SELECT @parentId_F67CED896AA34CCF92492D5FFE566B2E = Id FROM Categories WHERE Slug = 'kia' AND IsDeleted = 0
    IF @parentId_F67CED896AA34CCF92492D5FFE566B2E IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('F67CED89-6AA3-4CCF-9249-2D5FFE566B2E', N'Sorento I', 'kia-sorento-i', @parentId_F67CED896AA34CCF92492D5FFE566B2E, NULL, NULL, 15, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'kia-sorento-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_32AAD64D75234AB496BB11FFE0433296 uniqueidentifier
    SELECT @parentId_32AAD64D75234AB496BB11FFE0433296 = Id FROM Categories WHERE Slug = 'kia' AND IsDeleted = 0
    IF @parentId_32AAD64D75234AB496BB11FFE0433296 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('32AAD64D-7523-4AB4-96BB-11FFE0433296', N'Sorento II', 'kia-sorento-ii', @parentId_32AAD64D75234AB496BB11FFE0433296, NULL, NULL, 16, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'kia-sorento-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_AE27C94BB0604F3A84FC662C03342E4F uniqueidentifier
    SELECT @parentId_AE27C94BB0604F3A84FC662C03342E4F = Id FROM Categories WHERE Slug = 'kia' AND IsDeleted = 0
    IF @parentId_AE27C94BB0604F3A84FC662C03342E4F IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('AE27C94B-B060-4F3A-84FC-662C03342E4F', N'Sorento III', 'kia-sorento-iii', @parentId_AE27C94BB0604F3A84FC662C03342E4F, NULL, NULL, 17, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'kia-sorento-iv' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_CE4327317CE8473AB19733E496D3B6A0 uniqueidentifier
    SELECT @parentId_CE4327317CE8473AB19733E496D3B6A0 = Id FROM Categories WHERE Slug = 'kia' AND IsDeleted = 0
    IF @parentId_CE4327317CE8473AB19733E496D3B6A0 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('CE432731-7CE8-473A-B197-33E496D3B6A0', N'Sorento IV', 'kia-sorento-iv', @parentId_CE4327317CE8473AB19733E496D3B6A0, NULL, NULL, 18, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'kia-soul-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_EBF5D961AAA9400DB5328F7BDB70EA34 uniqueidentifier
    SELECT @parentId_EBF5D961AAA9400DB5328F7BDB70EA34 = Id FROM Categories WHERE Slug = 'kia' AND IsDeleted = 0
    IF @parentId_EBF5D961AAA9400DB5328F7BDB70EA34 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('EBF5D961-AAA9-400D-B532-8F7BDB70EA34', N'Soul I', 'kia-soul-i', @parentId_EBF5D961AAA9400DB5328F7BDB70EA34, NULL, NULL, 19, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'kia-soul-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_E99A10781E48484493E55F53F6FE1D25 uniqueidentifier
    SELECT @parentId_E99A10781E48484493E55F53F6FE1D25 = Id FROM Categories WHERE Slug = 'kia' AND IsDeleted = 0
    IF @parentId_E99A10781E48484493E55F53F6FE1D25 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('E99A1078-1E48-4844-93E5-5F53F6FE1D25', N'Soul II', 'kia-soul-ii', @parentId_E99A10781E48484493E55F53F6FE1D25, NULL, NULL, 20, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'kia-soul-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_05FEC4293D3E4F3EA879A599786B896D uniqueidentifier
    SELECT @parentId_05FEC4293D3E4F3EA879A599786B896D = Id FROM Categories WHERE Slug = 'kia' AND IsDeleted = 0
    IF @parentId_05FEC4293D3E4F3EA879A599786B896D IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('05FEC429-3D3E-4F3E-A879-A599786B896D', N'Soul III', 'kia-soul-iii', @parentId_05FEC4293D3E4F3EA879A599786B896D, NULL, NULL, 21, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'kia-niro-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_3F3C02EC3B064B9A886428931BBCAC04 uniqueidentifier
    SELECT @parentId_3F3C02EC3B064B9A886428931BBCAC04 = Id FROM Categories WHERE Slug = 'kia' AND IsDeleted = 0
    IF @parentId_3F3C02EC3B064B9A886428931BBCAC04 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('3F3C02EC-3B06-4B9A-8864-28931BBCAC04', N'Niro I', 'kia-niro-i', @parentId_3F3C02EC3B064B9A886428931BBCAC04, NULL, NULL, 22, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'kia-stonic' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_A0644F77797C4BD586A9132E6239A302 uniqueidentifier
    SELECT @parentId_A0644F77797C4BD586A9132E6239A302 = Id FROM Categories WHERE Slug = 'kia' AND IsDeleted = 0
    IF @parentId_A0644F77797C4BD586A9132E6239A302 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('A0644F77-797C-4BD5-86A9-132E6239A302', N'Stonic', 'kia-stonic', @parentId_A0644F77797C4BD586A9132E6239A302, NULL, NULL, 23, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'kia-proceed' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_C43A6FFA22484A22B0A66E237E218C21 uniqueidentifier
    SELECT @parentId_C43A6FFA22484A22B0A66E237E218C21 = Id FROM Categories WHERE Slug = 'kia' AND IsDeleted = 0
    IF @parentId_C43A6FFA22484A22B0A66E237E218C21 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('C43A6FFA-2248-4A22-B0A6-6E237E218C21', N'ProCeed', 'kia-proceed', @parentId_C43A6FFA22484A22B0A66E237E218C21, NULL, NULL, 24, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'kia-ev6' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_2301DB95AA474EC0B73E023D4C51D692 uniqueidentifier
    SELECT @parentId_2301DB95AA474EC0B73E023D4C51D692 = Id FROM Categories WHERE Slug = 'kia' AND IsDeleted = 0
    IF @parentId_2301DB95AA474EC0B73E023D4C51D692 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('2301DB95-AA47-4EC0-B73E-023D4C51D692', N'EV6', 'kia-ev6', @parentId_2301DB95AA474EC0B73E023D4C51D692, NULL, NULL, 25, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'honda' AND IsDeleted = 0)
BEGIN
    INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
    VALUES ('A387B85D-2FBE-41AE-9E33-172145D80325', N'Honda', 'honda', NULL, NULL, NULL, 16, 1, 1, 1, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
ELSE
BEGIN
    -- Varsa ShowInVehicleNav=true gÃ¼ncelle
    UPDATE Categories SET ShowInVehicleNav = 1 WHERE Slug = 'honda' AND IsDeleted = 0
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'honda-civic-iv' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_5D0106AA68B049ACA970C0EC3E5BF5CC uniqueidentifier
    SELECT @parentId_5D0106AA68B049ACA970C0EC3E5BF5CC = Id FROM Categories WHERE Slug = 'honda' AND IsDeleted = 0
    IF @parentId_5D0106AA68B049ACA970C0EC3E5BF5CC IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('5D0106AA-68B0-49AC-A970-C0EC3E5BF5CC', N'Civic IV', 'honda-civic-iv', @parentId_5D0106AA68B049ACA970C0EC3E5BF5CC, NULL, NULL, 0, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'honda-civic-v' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_AB36E236DA344D09920303AE889283DE uniqueidentifier
    SELECT @parentId_AB36E236DA344D09920303AE889283DE = Id FROM Categories WHERE Slug = 'honda' AND IsDeleted = 0
    IF @parentId_AB36E236DA344D09920303AE889283DE IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('AB36E236-DA34-4D09-9203-03AE889283DE', N'Civic V', 'honda-civic-v', @parentId_AB36E236DA344D09920303AE889283DE, NULL, NULL, 1, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'honda-civic-vi' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_11CDC821193441D89DC15EA9DF51ED75 uniqueidentifier
    SELECT @parentId_11CDC821193441D89DC15EA9DF51ED75 = Id FROM Categories WHERE Slug = 'honda' AND IsDeleted = 0
    IF @parentId_11CDC821193441D89DC15EA9DF51ED75 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('11CDC821-1934-41D8-9DC1-5EA9DF51ED75', N'Civic VI', 'honda-civic-vi', @parentId_11CDC821193441D89DC15EA9DF51ED75, NULL, NULL, 2, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'honda-civic-vii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_664518AA0991488A9FA82797AB149E8E uniqueidentifier
    SELECT @parentId_664518AA0991488A9FA82797AB149E8E = Id FROM Categories WHERE Slug = 'honda' AND IsDeleted = 0
    IF @parentId_664518AA0991488A9FA82797AB149E8E IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('664518AA-0991-488A-9FA8-2797AB149E8E', N'Civic VII', 'honda-civic-vii', @parentId_664518AA0991488A9FA82797AB149E8E, NULL, NULL, 3, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'honda-civic-viii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_C13915A6000A401BB59FCF423829FB5B uniqueidentifier
    SELECT @parentId_C13915A6000A401BB59FCF423829FB5B = Id FROM Categories WHERE Slug = 'honda' AND IsDeleted = 0
    IF @parentId_C13915A6000A401BB59FCF423829FB5B IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('C13915A6-000A-401B-B59F-CF423829FB5B', N'Civic VIII', 'honda-civic-viii', @parentId_C13915A6000A401BB59FCF423829FB5B, NULL, NULL, 4, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'honda-civic-ix' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_3BD8D9500F4D40D382168AB770348C3C uniqueidentifier
    SELECT @parentId_3BD8D9500F4D40D382168AB770348C3C = Id FROM Categories WHERE Slug = 'honda' AND IsDeleted = 0
    IF @parentId_3BD8D9500F4D40D382168AB770348C3C IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('3BD8D950-0F4D-40D3-8216-8AB770348C3C', N'Civic IX', 'honda-civic-ix', @parentId_3BD8D9500F4D40D382168AB770348C3C, NULL, NULL, 5, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'honda-civic-x' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_F22A48A9CEED48B9910F8E660728627E uniqueidentifier
    SELECT @parentId_F22A48A9CEED48B9910F8E660728627E = Id FROM Categories WHERE Slug = 'honda' AND IsDeleted = 0
    IF @parentId_F22A48A9CEED48B9910F8E660728627E IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('F22A48A9-CEED-48B9-910F-8E660728627E', N'Civic X', 'honda-civic-x', @parentId_F22A48A9CEED48B9910F8E660728627E, NULL, NULL, 6, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'honda-civic-xi' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_00365447F86B4677B8F7318D9C4812C6 uniqueidentifier
    SELECT @parentId_00365447F86B4677B8F7318D9C4812C6 = Id FROM Categories WHERE Slug = 'honda' AND IsDeleted = 0
    IF @parentId_00365447F86B4677B8F7318D9C4812C6 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('00365447-F86B-4677-B8F7-318D9C4812C6', N'Civic XI', 'honda-civic-xi', @parentId_00365447F86B4677B8F7318D9C4812C6, NULL, NULL, 7, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'honda-jazz-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_B17184BB43B1485DAA1F30B5F5E279B3 uniqueidentifier
    SELECT @parentId_B17184BB43B1485DAA1F30B5F5E279B3 = Id FROM Categories WHERE Slug = 'honda' AND IsDeleted = 0
    IF @parentId_B17184BB43B1485DAA1F30B5F5E279B3 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('B17184BB-43B1-485D-AA1F-30B5F5E279B3', N'Jazz I', 'honda-jazz-i', @parentId_B17184BB43B1485DAA1F30B5F5E279B3, NULL, NULL, 8, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'honda-jazz-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_9F5236B0899846D38C8089C13223C4DA uniqueidentifier
    SELECT @parentId_9F5236B0899846D38C8089C13223C4DA = Id FROM Categories WHERE Slug = 'honda' AND IsDeleted = 0
    IF @parentId_9F5236B0899846D38C8089C13223C4DA IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('9F5236B0-8998-46D3-8C80-89C13223C4DA', N'Jazz II', 'honda-jazz-ii', @parentId_9F5236B0899846D38C8089C13223C4DA, NULL, NULL, 9, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'honda-jazz-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_D5F3D1EBBC3346B8A3E85A71447C1D0E uniqueidentifier
    SELECT @parentId_D5F3D1EBBC3346B8A3E85A71447C1D0E = Id FROM Categories WHERE Slug = 'honda' AND IsDeleted = 0
    IF @parentId_D5F3D1EBBC3346B8A3E85A71447C1D0E IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('D5F3D1EB-BC33-46B8-A3E8-5A71447C1D0E', N'Jazz III', 'honda-jazz-iii', @parentId_D5F3D1EBBC3346B8A3E85A71447C1D0E, NULL, NULL, 10, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'honda-jazz-iv' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_3B68AE54C5884303B3862070605E223E uniqueidentifier
    SELECT @parentId_3B68AE54C5884303B3862070605E223E = Id FROM Categories WHERE Slug = 'honda' AND IsDeleted = 0
    IF @parentId_3B68AE54C5884303B3862070605E223E IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('3B68AE54-C588-4303-B386-2070605E223E', N'Jazz IV', 'honda-jazz-iv', @parentId_3B68AE54C5884303B3862070605E223E, NULL, NULL, 11, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'honda-cr-v-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_FB6FE47EFD4A4D31A28B2C68CE2FC676 uniqueidentifier
    SELECT @parentId_FB6FE47EFD4A4D31A28B2C68CE2FC676 = Id FROM Categories WHERE Slug = 'honda' AND IsDeleted = 0
    IF @parentId_FB6FE47EFD4A4D31A28B2C68CE2FC676 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('FB6FE47E-FD4A-4D31-A28B-2C68CE2FC676', N'CR-V I', 'honda-cr-v-i', @parentId_FB6FE47EFD4A4D31A28B2C68CE2FC676, NULL, NULL, 12, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'honda-cr-v-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_55FE007B6FC244D182497A2E88D2EC38 uniqueidentifier
    SELECT @parentId_55FE007B6FC244D182497A2E88D2EC38 = Id FROM Categories WHERE Slug = 'honda' AND IsDeleted = 0
    IF @parentId_55FE007B6FC244D182497A2E88D2EC38 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('55FE007B-6FC2-44D1-8249-7A2E88D2EC38', N'CR-V II', 'honda-cr-v-ii', @parentId_55FE007B6FC244D182497A2E88D2EC38, NULL, NULL, 13, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'honda-cr-v-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_8B23ABB4213A4352A8B3BB6326DF368D uniqueidentifier
    SELECT @parentId_8B23ABB4213A4352A8B3BB6326DF368D = Id FROM Categories WHERE Slug = 'honda' AND IsDeleted = 0
    IF @parentId_8B23ABB4213A4352A8B3BB6326DF368D IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('8B23ABB4-213A-4352-A8B3-BB6326DF368D', N'CR-V III', 'honda-cr-v-iii', @parentId_8B23ABB4213A4352A8B3BB6326DF368D, NULL, NULL, 14, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'honda-cr-v-iv' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_371068615A6C42AB996D5715DB1A66D9 uniqueidentifier
    SELECT @parentId_371068615A6C42AB996D5715DB1A66D9 = Id FROM Categories WHERE Slug = 'honda' AND IsDeleted = 0
    IF @parentId_371068615A6C42AB996D5715DB1A66D9 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('37106861-5A6C-42AB-996D-5715DB1A66D9', N'CR-V IV', 'honda-cr-v-iv', @parentId_371068615A6C42AB996D5715DB1A66D9, NULL, NULL, 15, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'honda-cr-v-v' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_BB90FB72E0CB4B35A2929951A300445E uniqueidentifier
    SELECT @parentId_BB90FB72E0CB4B35A2929951A300445E = Id FROM Categories WHERE Slug = 'honda' AND IsDeleted = 0
    IF @parentId_BB90FB72E0CB4B35A2929951A300445E IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('BB90FB72-E0CB-4B35-A292-9951A300445E', N'CR-V V', 'honda-cr-v-v', @parentId_BB90FB72E0CB4B35A2929951A300445E, NULL, NULL, 16, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'honda-hr-v-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_E465B742321047628C792B95685987D2 uniqueidentifier
    SELECT @parentId_E465B742321047628C792B95685987D2 = Id FROM Categories WHERE Slug = 'honda' AND IsDeleted = 0
    IF @parentId_E465B742321047628C792B95685987D2 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('E465B742-3210-4762-8C79-2B95685987D2', N'HR-V I', 'honda-hr-v-i', @parentId_E465B742321047628C792B95685987D2, NULL, NULL, 17, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'honda-hr-v-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_57620844153A4B99882A4965091B951A uniqueidentifier
    SELECT @parentId_57620844153A4B99882A4965091B951A = Id FROM Categories WHERE Slug = 'honda' AND IsDeleted = 0
    IF @parentId_57620844153A4B99882A4965091B951A IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('57620844-153A-4B99-882A-4965091B951A', N'HR-V II', 'honda-hr-v-ii', @parentId_57620844153A4B99882A4965091B951A, NULL, NULL, 18, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'honda-hr-v-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_B9DA26310BBE44F69E932542311572AC uniqueidentifier
    SELECT @parentId_B9DA26310BBE44F69E932542311572AC = Id FROM Categories WHERE Slug = 'honda' AND IsDeleted = 0
    IF @parentId_B9DA26310BBE44F69E932542311572AC IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('B9DA2631-0BBE-44F6-9E93-2542311572AC', N'HR-V III', 'honda-hr-v-iii', @parentId_B9DA26310BBE44F69E932542311572AC, NULL, NULL, 19, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'honda-accord-v' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_9AE95AADFDE04F13BE478C788BC7F887 uniqueidentifier
    SELECT @parentId_9AE95AADFDE04F13BE478C788BC7F887 = Id FROM Categories WHERE Slug = 'honda' AND IsDeleted = 0
    IF @parentId_9AE95AADFDE04F13BE478C788BC7F887 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('9AE95AAD-FDE0-4F13-BE47-8C788BC7F887', N'Accord V', 'honda-accord-v', @parentId_9AE95AADFDE04F13BE478C788BC7F887, NULL, NULL, 20, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'honda-accord-vi' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_E68CFC297A9F4D1A898FAFB2C51DF4F2 uniqueidentifier
    SELECT @parentId_E68CFC297A9F4D1A898FAFB2C51DF4F2 = Id FROM Categories WHERE Slug = 'honda' AND IsDeleted = 0
    IF @parentId_E68CFC297A9F4D1A898FAFB2C51DF4F2 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('E68CFC29-7A9F-4D1A-898F-AFB2C51DF4F2', N'Accord VI', 'honda-accord-vi', @parentId_E68CFC297A9F4D1A898FAFB2C51DF4F2, NULL, NULL, 21, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'honda-accord-vii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_AFA18A1731704CD9B8EA46BF8F225B73 uniqueidentifier
    SELECT @parentId_AFA18A1731704CD9B8EA46BF8F225B73 = Id FROM Categories WHERE Slug = 'honda' AND IsDeleted = 0
    IF @parentId_AFA18A1731704CD9B8EA46BF8F225B73 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('AFA18A17-3170-4CD9-B8EA-46BF8F225B73', N'Accord VII', 'honda-accord-vii', @parentId_AFA18A1731704CD9B8EA46BF8F225B73, NULL, NULL, 22, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'honda-accord-viii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_D4F1F8C53D5542AD905E8494A616003B uniqueidentifier
    SELECT @parentId_D4F1F8C53D5542AD905E8494A616003B = Id FROM Categories WHERE Slug = 'honda' AND IsDeleted = 0
    IF @parentId_D4F1F8C53D5542AD905E8494A616003B IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('D4F1F8C5-3D55-42AD-905E-8494A616003B', N'Accord VIII', 'honda-accord-viii', @parentId_D4F1F8C53D5542AD905E8494A616003B, NULL, NULL, 23, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'honda-fr-v' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_48A34E9E4E6D432F80B6C0C95F724B2D uniqueidentifier
    SELECT @parentId_48A34E9E4E6D432F80B6C0C95F724B2D = Id FROM Categories WHERE Slug = 'honda' AND IsDeleted = 0
    IF @parentId_48A34E9E4E6D432F80B6C0C95F724B2D IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('48A34E9E-4E6D-432F-80B6-C0C95F724B2D', N'FR-V', 'honda-fr-v', @parentId_48A34E9E4E6D432F80B6C0C95F724B2D, NULL, NULL, 24, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'nissan' AND IsDeleted = 0)
BEGIN
    INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
    VALUES ('17835C70-2D42-4E65-AF4B-DFE7344E8BC9', N'Nissan', 'nissan', NULL, NULL, NULL, 17, 1, 1, 1, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
ELSE
BEGIN
    -- Varsa ShowInVehicleNav=true gÃ¼ncelle
    UPDATE Categories SET ShowInVehicleNav = 1 WHERE Slug = 'nissan' AND IsDeleted = 0
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'nissan-micra-k11' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_39AA908E83A24F5DAE806FB2760784F9 uniqueidentifier
    SELECT @parentId_39AA908E83A24F5DAE806FB2760784F9 = Id FROM Categories WHERE Slug = 'nissan' AND IsDeleted = 0
    IF @parentId_39AA908E83A24F5DAE806FB2760784F9 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('39AA908E-83A2-4F5D-AE80-6FB2760784F9', N'Micra K11', 'nissan-micra-k11', @parentId_39AA908E83A24F5DAE806FB2760784F9, NULL, NULL, 0, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'nissan-micra-k12' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_6456C0C7BAB849D2842552029A8C913E uniqueidentifier
    SELECT @parentId_6456C0C7BAB849D2842552029A8C913E = Id FROM Categories WHERE Slug = 'nissan' AND IsDeleted = 0
    IF @parentId_6456C0C7BAB849D2842552029A8C913E IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('6456C0C7-BAB8-49D2-8425-52029A8C913E', N'Micra K12', 'nissan-micra-k12', @parentId_6456C0C7BAB849D2842552029A8C913E, NULL, NULL, 1, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'nissan-micra-k13' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_1FAC7E2A583D47089C52A384AEF36E20 uniqueidentifier
    SELECT @parentId_1FAC7E2A583D47089C52A384AEF36E20 = Id FROM Categories WHERE Slug = 'nissan' AND IsDeleted = 0
    IF @parentId_1FAC7E2A583D47089C52A384AEF36E20 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('1FAC7E2A-583D-4708-9C52-A384AEF36E20', N'Micra K13', 'nissan-micra-k13', @parentId_1FAC7E2A583D47089C52A384AEF36E20, NULL, NULL, 2, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'nissan-micra-k14' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_E5955134DD18434D8B9F4BEB29DCCB7F uniqueidentifier
    SELECT @parentId_E5955134DD18434D8B9F4BEB29DCCB7F = Id FROM Categories WHERE Slug = 'nissan' AND IsDeleted = 0
    IF @parentId_E5955134DD18434D8B9F4BEB29DCCB7F IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('E5955134-DD18-434D-8B9F-4BEB29DCCB7F', N'Micra K14', 'nissan-micra-k14', @parentId_E5955134DD18434D8B9F4BEB29DCCB7F, NULL, NULL, 3, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'nissan-note-e11' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_89DE918C9C87410CA6F801F1EB17CB5B uniqueidentifier
    SELECT @parentId_89DE918C9C87410CA6F801F1EB17CB5B = Id FROM Categories WHERE Slug = 'nissan' AND IsDeleted = 0
    IF @parentId_89DE918C9C87410CA6F801F1EB17CB5B IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('89DE918C-9C87-410C-A6F8-01F1EB17CB5B', N'Note E11', 'nissan-note-e11', @parentId_89DE918C9C87410CA6F801F1EB17CB5B, NULL, NULL, 4, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'nissan-note-e12' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_90152218B09A482AA470DB792BF71BED uniqueidentifier
    SELECT @parentId_90152218B09A482AA470DB792BF71BED = Id FROM Categories WHERE Slug = 'nissan' AND IsDeleted = 0
    IF @parentId_90152218B09A482AA470DB792BF71BED IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('90152218-B09A-482A-A470-DB792BF71BED', N'Note E12', 'nissan-note-e12', @parentId_90152218B09A482AA470DB792BF71BED, NULL, NULL, 5, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'nissan-juke-f15' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_C2CB7846B4E247CA9C76D53802FBE768 uniqueidentifier
    SELECT @parentId_C2CB7846B4E247CA9C76D53802FBE768 = Id FROM Categories WHERE Slug = 'nissan' AND IsDeleted = 0
    IF @parentId_C2CB7846B4E247CA9C76D53802FBE768 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('C2CB7846-B4E2-47CA-9C76-D53802FBE768', N'Juke F15', 'nissan-juke-f15', @parentId_C2CB7846B4E247CA9C76D53802FBE768, NULL, NULL, 6, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'nissan-juke-f16' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_230BE9DB52364B8AA466CDD57F914F7A uniqueidentifier
    SELECT @parentId_230BE9DB52364B8AA466CDD57F914F7A = Id FROM Categories WHERE Slug = 'nissan' AND IsDeleted = 0
    IF @parentId_230BE9DB52364B8AA466CDD57F914F7A IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('230BE9DB-5236-4B8A-A466-CDD57F914F7A', N'Juke F16', 'nissan-juke-f16', @parentId_230BE9DB52364B8AA466CDD57F914F7A, NULL, NULL, 7, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'nissan-qashqai-j10' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_EB098FA4375945B7B1DA7B6569069191 uniqueidentifier
    SELECT @parentId_EB098FA4375945B7B1DA7B6569069191 = Id FROM Categories WHERE Slug = 'nissan' AND IsDeleted = 0
    IF @parentId_EB098FA4375945B7B1DA7B6569069191 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('EB098FA4-3759-45B7-B1DA-7B6569069191', N'Qashqai J10', 'nissan-qashqai-j10', @parentId_EB098FA4375945B7B1DA7B6569069191, NULL, NULL, 8, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'nissan-qashqai-j11' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_C9123757C1B742919AC3CC44B2E9CCFE uniqueidentifier
    SELECT @parentId_C9123757C1B742919AC3CC44B2E9CCFE = Id FROM Categories WHERE Slug = 'nissan' AND IsDeleted = 0
    IF @parentId_C9123757C1B742919AC3CC44B2E9CCFE IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('C9123757-C1B7-4291-9AC3-CC44B2E9CCFE', N'Qashqai J11', 'nissan-qashqai-j11', @parentId_C9123757C1B742919AC3CC44B2E9CCFE, NULL, NULL, 9, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'nissan-qashqai-j12' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_1EBBC4100C80433EA5154B0C42FDB2AA uniqueidentifier
    SELECT @parentId_1EBBC4100C80433EA5154B0C42FDB2AA = Id FROM Categories WHERE Slug = 'nissan' AND IsDeleted = 0
    IF @parentId_1EBBC4100C80433EA5154B0C42FDB2AA IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('1EBBC410-0C80-433E-A515-4B0C42FDB2AA', N'Qashqai J12', 'nissan-qashqai-j12', @parentId_1EBBC4100C80433EA5154B0C42FDB2AA, NULL, NULL, 10, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'nissan-x-trail-t30' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_E02EBB372BEF4E02B950317095DF8E47 uniqueidentifier
    SELECT @parentId_E02EBB372BEF4E02B950317095DF8E47 = Id FROM Categories WHERE Slug = 'nissan' AND IsDeleted = 0
    IF @parentId_E02EBB372BEF4E02B950317095DF8E47 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('E02EBB37-2BEF-4E02-B950-317095DF8E47', N'X-Trail T30', 'nissan-x-trail-t30', @parentId_E02EBB372BEF4E02B950317095DF8E47, NULL, NULL, 11, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'nissan-x-trail-t31' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_7437BB73F76A41939CDF8B577DFC75EB uniqueidentifier
    SELECT @parentId_7437BB73F76A41939CDF8B577DFC75EB = Id FROM Categories WHERE Slug = 'nissan' AND IsDeleted = 0
    IF @parentId_7437BB73F76A41939CDF8B577DFC75EB IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('7437BB73-F76A-4193-9CDF-8B577DFC75EB', N'X-Trail T31', 'nissan-x-trail-t31', @parentId_7437BB73F76A41939CDF8B577DFC75EB, NULL, NULL, 12, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'nissan-x-trail-t32' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_80DABA30A4B74D4AA496311F490C22CC uniqueidentifier
    SELECT @parentId_80DABA30A4B74D4AA496311F490C22CC = Id FROM Categories WHERE Slug = 'nissan' AND IsDeleted = 0
    IF @parentId_80DABA30A4B74D4AA496311F490C22CC IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('80DABA30-A4B7-4D4A-A496-311F490C22CC', N'X-Trail T32', 'nissan-x-trail-t32', @parentId_80DABA30A4B74D4AA496311F490C22CC, NULL, NULL, 13, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'nissan-navara-d22' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_676CC4F3DECF48FE96531CD4572A5D60 uniqueidentifier
    SELECT @parentId_676CC4F3DECF48FE96531CD4572A5D60 = Id FROM Categories WHERE Slug = 'nissan' AND IsDeleted = 0
    IF @parentId_676CC4F3DECF48FE96531CD4572A5D60 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('676CC4F3-DECF-48FE-9653-1CD4572A5D60', N'Navara D22', 'nissan-navara-d22', @parentId_676CC4F3DECF48FE96531CD4572A5D60, NULL, NULL, 14, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'nissan-navara-d40' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_4ADFDFD4EA3841CBBBA93E61CCDFCCD3 uniqueidentifier
    SELECT @parentId_4ADFDFD4EA3841CBBBA93E61CCDFCCD3 = Id FROM Categories WHERE Slug = 'nissan' AND IsDeleted = 0
    IF @parentId_4ADFDFD4EA3841CBBBA93E61CCDFCCD3 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('4ADFDFD4-EA38-41CB-BBA9-3E61CCDFCCD3', N'Navara D40', 'nissan-navara-d40', @parentId_4ADFDFD4EA3841CBBBA93E61CCDFCCD3, NULL, NULL, 15, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'nissan-navara-d23' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_906F03A22C954C4DA8B8D82952E16AB7 uniqueidentifier
    SELECT @parentId_906F03A22C954C4DA8B8D82952E16AB7 = Id FROM Categories WHERE Slug = 'nissan' AND IsDeleted = 0
    IF @parentId_906F03A22C954C4DA8B8D82952E16AB7 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('906F03A2-2C95-4C4D-A8B8-D82952E16AB7', N'Navara D23', 'nissan-navara-d23', @parentId_906F03A22C954C4DA8B8D82952E16AB7, NULL, NULL, 16, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'nissan-leaf-ze0' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_74BD226DE53843E693F1C04E922F1F0B uniqueidentifier
    SELECT @parentId_74BD226DE53843E693F1C04E922F1F0B = Id FROM Categories WHERE Slug = 'nissan' AND IsDeleted = 0
    IF @parentId_74BD226DE53843E693F1C04E922F1F0B IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('74BD226D-E538-43E6-93F1-C04E922F1F0B', N'Leaf ZE0', 'nissan-leaf-ze0', @parentId_74BD226DE53843E693F1C04E922F1F0B, NULL, NULL, 17, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'nissan-leaf-ze1' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_5A66B848D1DA4AD5A8FAEF9DA79C4EA0 uniqueidentifier
    SELECT @parentId_5A66B848D1DA4AD5A8FAEF9DA79C4EA0 = Id FROM Categories WHERE Slug = 'nissan' AND IsDeleted = 0
    IF @parentId_5A66B848D1DA4AD5A8FAEF9DA79C4EA0 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('5A66B848-D1DA-4AD5-A8FA-EF9DA79C4EA0', N'Leaf ZE1', 'nissan-leaf-ze1', @parentId_5A66B848D1DA4AD5A8FAEF9DA79C4EA0, NULL, NULL, 18, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'nissan-pulsar-c13' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_992199F3D66E41F090655527FE29CD1E uniqueidentifier
    SELECT @parentId_992199F3D66E41F090655527FE29CD1E = Id FROM Categories WHERE Slug = 'nissan' AND IsDeleted = 0
    IF @parentId_992199F3D66E41F090655527FE29CD1E IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('992199F3-D66E-41F0-9065-5527FE29CD1E', N'Pulsar C13', 'nissan-pulsar-c13', @parentId_992199F3D66E41F090655527FE29CD1E, NULL, NULL, 19, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mazda' AND IsDeleted = 0)
BEGIN
    INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
    VALUES ('BF38C3B0-FFF2-4F08-8152-123D0BC2C08E', N'Mazda', 'mazda', NULL, NULL, NULL, 18, 1, 1, 1, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
ELSE
BEGIN
    -- Varsa ShowInVehicleNav=true gÃ¼ncelle
    UPDATE Categories SET ShowInVehicleNav = 1 WHERE Slug = 'mazda' AND IsDeleted = 0
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mazda-mazda-2-dj' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_B178FCFB88AA4BF5B4F355D9F870BD55 uniqueidentifier
    SELECT @parentId_B178FCFB88AA4BF5B4F355D9F870BD55 = Id FROM Categories WHERE Slug = 'mazda' AND IsDeleted = 0
    IF @parentId_B178FCFB88AA4BF5B4F355D9F870BD55 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('B178FCFB-88AA-4BF5-B4F3-55D9F870BD55', N'Mazda 2 DJ', 'mazda-mazda-2-dj', @parentId_B178FCFB88AA4BF5B4F355D9F870BD55, NULL, NULL, 0, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mazda-mazda-2-dy' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_F0385C239B3F48AD97BDB8BC58266633 uniqueidentifier
    SELECT @parentId_F0385C239B3F48AD97BDB8BC58266633 = Id FROM Categories WHERE Slug = 'mazda' AND IsDeleted = 0
    IF @parentId_F0385C239B3F48AD97BDB8BC58266633 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('F0385C23-9B3F-48AD-97BD-B8BC58266633', N'Mazda 2 DY', 'mazda-mazda-2-dy', @parentId_F0385C239B3F48AD97BDB8BC58266633, NULL, NULL, 1, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mazda-mazda-3-bk' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_B40B63F2D22A4D40BC8F0317B23F50B0 uniqueidentifier
    SELECT @parentId_B40B63F2D22A4D40BC8F0317B23F50B0 = Id FROM Categories WHERE Slug = 'mazda' AND IsDeleted = 0
    IF @parentId_B40B63F2D22A4D40BC8F0317B23F50B0 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('B40B63F2-D22A-4D40-BC8F-0317B23F50B0', N'Mazda 3 BK', 'mazda-mazda-3-bk', @parentId_B40B63F2D22A4D40BC8F0317B23F50B0, NULL, NULL, 2, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mazda-mazda-3-bl' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_1FD4BBD1D5494A39839BEFBC9CE13D20 uniqueidentifier
    SELECT @parentId_1FD4BBD1D5494A39839BEFBC9CE13D20 = Id FROM Categories WHERE Slug = 'mazda' AND IsDeleted = 0
    IF @parentId_1FD4BBD1D5494A39839BEFBC9CE13D20 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('1FD4BBD1-D549-4A39-839B-EFBC9CE13D20', N'Mazda 3 BL', 'mazda-mazda-3-bl', @parentId_1FD4BBD1D5494A39839BEFBC9CE13D20, NULL, NULL, 3, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mazda-mazda-3-bm' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_2ED386F1F0FD463EBB38C4DAC45A0A6A uniqueidentifier
    SELECT @parentId_2ED386F1F0FD463EBB38C4DAC45A0A6A = Id FROM Categories WHERE Slug = 'mazda' AND IsDeleted = 0
    IF @parentId_2ED386F1F0FD463EBB38C4DAC45A0A6A IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('2ED386F1-F0FD-463E-BB38-C4DAC45A0A6A', N'Mazda 3 BM', 'mazda-mazda-3-bm', @parentId_2ED386F1F0FD463EBB38C4DAC45A0A6A, NULL, NULL, 4, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mazda-mazda-3-bp' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_F6A09A4B8D7748F99581B065FE5F2AD3 uniqueidentifier
    SELECT @parentId_F6A09A4B8D7748F99581B065FE5F2AD3 = Id FROM Categories WHERE Slug = 'mazda' AND IsDeleted = 0
    IF @parentId_F6A09A4B8D7748F99581B065FE5F2AD3 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('F6A09A4B-8D77-48F9-9581-B065FE5F2AD3', N'Mazda 3 BP', 'mazda-mazda-3-bp', @parentId_F6A09A4B8D7748F99581B065FE5F2AD3, NULL, NULL, 5, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mazda-mazda-6-gg' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_E74BE84D39EE44A1AF1B67D38C4CEFB7 uniqueidentifier
    SELECT @parentId_E74BE84D39EE44A1AF1B67D38C4CEFB7 = Id FROM Categories WHERE Slug = 'mazda' AND IsDeleted = 0
    IF @parentId_E74BE84D39EE44A1AF1B67D38C4CEFB7 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('E74BE84D-39EE-44A1-AF1B-67D38C4CEFB7', N'Mazda 6 GG', 'mazda-mazda-6-gg', @parentId_E74BE84D39EE44A1AF1B67D38C4CEFB7, NULL, NULL, 6, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mazda-mazda-6-gh' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_DAF0315917C0483894647FB4F6187611 uniqueidentifier
    SELECT @parentId_DAF0315917C0483894647FB4F6187611 = Id FROM Categories WHERE Slug = 'mazda' AND IsDeleted = 0
    IF @parentId_DAF0315917C0483894647FB4F6187611 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('DAF03159-17C0-4838-9464-7FB4F6187611', N'Mazda 6 GH', 'mazda-mazda-6-gh', @parentId_DAF0315917C0483894647FB4F6187611, NULL, NULL, 7, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mazda-mazda-6-gj' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_F1C5F307B5854E3AB35051633A2CCCBA uniqueidentifier
    SELECT @parentId_F1C5F307B5854E3AB35051633A2CCCBA = Id FROM Categories WHERE Slug = 'mazda' AND IsDeleted = 0
    IF @parentId_F1C5F307B5854E3AB35051633A2CCCBA IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('F1C5F307-B585-4E3A-B350-51633A2CCCBA', N'Mazda 6 GJ', 'mazda-mazda-6-gj', @parentId_F1C5F307B5854E3AB35051633A2CCCBA, NULL, NULL, 8, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mazda-mazda-6-gl' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_823326D85A0E4FFBAC2692DA3F84B823 uniqueidentifier
    SELECT @parentId_823326D85A0E4FFBAC2692DA3F84B823 = Id FROM Categories WHERE Slug = 'mazda' AND IsDeleted = 0
    IF @parentId_823326D85A0E4FFBAC2692DA3F84B823 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('823326D8-5A0E-4FFB-AC26-92DA3F84B823', N'Mazda 6 GL', 'mazda-mazda-6-gl', @parentId_823326D85A0E4FFBAC2692DA3F84B823, NULL, NULL, 9, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mazda-cx-3' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_280D19687EF344A8A105A565627A9973 uniqueidentifier
    SELECT @parentId_280D19687EF344A8A105A565627A9973 = Id FROM Categories WHERE Slug = 'mazda' AND IsDeleted = 0
    IF @parentId_280D19687EF344A8A105A565627A9973 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('280D1968-7EF3-44A8-A105-A565627A9973', N'CX-3', 'mazda-cx-3', @parentId_280D19687EF344A8A105A565627A9973, NULL, NULL, 10, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mazda-cx-5-ke' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_6FBB57E3BD3441CCAADDDCB98DFE003D uniqueidentifier
    SELECT @parentId_6FBB57E3BD3441CCAADDDCB98DFE003D = Id FROM Categories WHERE Slug = 'mazda' AND IsDeleted = 0
    IF @parentId_6FBB57E3BD3441CCAADDDCB98DFE003D IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('6FBB57E3-BD34-41CC-AADD-DCB98DFE003D', N'CX-5 KE', 'mazda-cx-5-ke', @parentId_6FBB57E3BD3441CCAADDDCB98DFE003D, NULL, NULL, 11, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mazda-cx-5-kf' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_60BE525499C24028A3D2E43153CB29DF uniqueidentifier
    SELECT @parentId_60BE525499C24028A3D2E43153CB29DF = Id FROM Categories WHERE Slug = 'mazda' AND IsDeleted = 0
    IF @parentId_60BE525499C24028A3D2E43153CB29DF IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('60BE5254-99C2-4028-A3D2-E43153CB29DF', N'CX-5 KF', 'mazda-cx-5-kf', @parentId_60BE525499C24028A3D2E43153CB29DF, NULL, NULL, 12, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mazda-cx-9' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_50EA2D9446FB4D4CBF7B2B1E1CDEB011 uniqueidentifier
    SELECT @parentId_50EA2D9446FB4D4CBF7B2B1E1CDEB011 = Id FROM Categories WHERE Slug = 'mazda' AND IsDeleted = 0
    IF @parentId_50EA2D9446FB4D4CBF7B2B1E1CDEB011 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('50EA2D94-46FB-4D4C-BF7B-2B1E1CDEB011', N'CX-9', 'mazda-cx-9', @parentId_50EA2D9446FB4D4CBF7B2B1E1CDEB011, NULL, NULL, 13, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mazda-mx-5-na' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_293455E895E34EBDAE12D9041A9DB42B uniqueidentifier
    SELECT @parentId_293455E895E34EBDAE12D9041A9DB42B = Id FROM Categories WHERE Slug = 'mazda' AND IsDeleted = 0
    IF @parentId_293455E895E34EBDAE12D9041A9DB42B IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('293455E8-95E3-4EBD-AE12-D9041A9DB42B', N'MX-5 NA', 'mazda-mx-5-na', @parentId_293455E895E34EBDAE12D9041A9DB42B, NULL, NULL, 14, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mazda-mx-5-nb' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_CB5B3922FD1949DB91352CB98B57324C uniqueidentifier
    SELECT @parentId_CB5B3922FD1949DB91352CB98B57324C = Id FROM Categories WHERE Slug = 'mazda' AND IsDeleted = 0
    IF @parentId_CB5B3922FD1949DB91352CB98B57324C IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('CB5B3922-FD19-49DB-9135-2CB98B57324C', N'MX-5 NB', 'mazda-mx-5-nb', @parentId_CB5B3922FD1949DB91352CB98B57324C, NULL, NULL, 15, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mazda-mx-5-nc' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_770BC381BB304BEC9943490D17CC5736 uniqueidentifier
    SELECT @parentId_770BC381BB304BEC9943490D17CC5736 = Id FROM Categories WHERE Slug = 'mazda' AND IsDeleted = 0
    IF @parentId_770BC381BB304BEC9943490D17CC5736 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('770BC381-BB30-4BEC-9943-490D17CC5736', N'MX-5 NC', 'mazda-mx-5-nc', @parentId_770BC381BB304BEC9943490D17CC5736, NULL, NULL, 16, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mazda-mx-5-nd' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_E384C7BC1AF94C64AE0E0F93C3745393 uniqueidentifier
    SELECT @parentId_E384C7BC1AF94C64AE0E0F93C3745393 = Id FROM Categories WHERE Slug = 'mazda' AND IsDeleted = 0
    IF @parentId_E384C7BC1AF94C64AE0E0F93C3745393 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('E384C7BC-1AF9-4C64-AE0E-0F93C3745393', N'MX-5 ND', 'mazda-mx-5-nd', @parentId_E384C7BC1AF94C64AE0E0F93C3745393, NULL, NULL, 17, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mazda-626-ge' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_9CE63E94B5C04AEEA5D20FE4C6A6D643 uniqueidentifier
    SELECT @parentId_9CE63E94B5C04AEEA5D20FE4C6A6D643 = Id FROM Categories WHERE Slug = 'mazda' AND IsDeleted = 0
    IF @parentId_9CE63E94B5C04AEEA5D20FE4C6A6D643 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('9CE63E94-B5C0-4AEE-A5D2-0FE4C6A6D643', N'626 GE', 'mazda-626-ge', @parentId_9CE63E94B5C04AEEA5D20FE4C6A6D643, NULL, NULL, 18, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mazda-323-bj' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_E03C2C7B16724D5EAB0804E549EBD474 uniqueidentifier
    SELECT @parentId_E03C2C7B16724D5EAB0804E549EBD474 = Id FROM Categories WHERE Slug = 'mazda' AND IsDeleted = 0
    IF @parentId_E03C2C7B16724D5EAB0804E549EBD474 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('E03C2C7B-1672-4D5E-AB08-04E549EBD474', N'323 BJ', 'mazda-323-bj', @parentId_E03C2C7B16724D5EAB0804E549EBD474, NULL, NULL, 19, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volvo' AND IsDeleted = 0)
BEGIN
    INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
    VALUES ('8E2D69EA-7AB5-4B9F-899B-B169E5FE8028', N'Volvo', 'volvo', NULL, NULL, NULL, 19, 1, 1, 1, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
ELSE
BEGIN
    -- Varsa ShowInVehicleNav=true gÃ¼ncelle
    UPDATE Categories SET ShowInVehicleNav = 1 WHERE Slug = 'volvo' AND IsDeleted = 0
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volvo-v40-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_A15881C7137C4369B756B03C867FC9A8 uniqueidentifier
    SELECT @parentId_A15881C7137C4369B756B03C867FC9A8 = Id FROM Categories WHERE Slug = 'volvo' AND IsDeleted = 0
    IF @parentId_A15881C7137C4369B756B03C867FC9A8 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('A15881C7-137C-4369-B756-B03C867FC9A8', N'V40 I', 'volvo-v40-i', @parentId_A15881C7137C4369B756B03C867FC9A8, NULL, NULL, 0, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volvo-v40-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_9C48D8AFD5AF4AF9AD9FF4EB97D3123C uniqueidentifier
    SELECT @parentId_9C48D8AFD5AF4AF9AD9FF4EB97D3123C = Id FROM Categories WHERE Slug = 'volvo' AND IsDeleted = 0
    IF @parentId_9C48D8AFD5AF4AF9AD9FF4EB97D3123C IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('9C48D8AF-D5AF-4AF9-AD9F-F4EB97D3123C', N'V40 II', 'volvo-v40-ii', @parentId_9C48D8AFD5AF4AF9AD9FF4EB97D3123C, NULL, NULL, 1, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volvo-v60-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_FE993A2D9BF74E9C9D7AF7F80E9E28C8 uniqueidentifier
    SELECT @parentId_FE993A2D9BF74E9C9D7AF7F80E9E28C8 = Id FROM Categories WHERE Slug = 'volvo' AND IsDeleted = 0
    IF @parentId_FE993A2D9BF74E9C9D7AF7F80E9E28C8 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('FE993A2D-9BF7-4E9C-9D7A-F7F80E9E28C8', N'V60 I', 'volvo-v60-i', @parentId_FE993A2D9BF74E9C9D7AF7F80E9E28C8, NULL, NULL, 2, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volvo-v60-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_C282AD16647C4E7B8BC7B97D97D7E23C uniqueidentifier
    SELECT @parentId_C282AD16647C4E7B8BC7B97D97D7E23C = Id FROM Categories WHERE Slug = 'volvo' AND IsDeleted = 0
    IF @parentId_C282AD16647C4E7B8BC7B97D97D7E23C IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('C282AD16-647C-4E7B-8BC7-B97D97D7E23C', N'V60 II', 'volvo-v60-ii', @parentId_C282AD16647C4E7B8BC7B97D97D7E23C, NULL, NULL, 3, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volvo-v70-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_9189AA402F9D4DA19BF9660E9D707B6F uniqueidentifier
    SELECT @parentId_9189AA402F9D4DA19BF9660E9D707B6F = Id FROM Categories WHERE Slug = 'volvo' AND IsDeleted = 0
    IF @parentId_9189AA402F9D4DA19BF9660E9D707B6F IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('9189AA40-2F9D-4DA1-9BF9-660E9D707B6F', N'V70 I', 'volvo-v70-i', @parentId_9189AA402F9D4DA19BF9660E9D707B6F, NULL, NULL, 4, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volvo-v70-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_E0DC73705C7B48D58DD0FFDF6A824CC8 uniqueidentifier
    SELECT @parentId_E0DC73705C7B48D58DD0FFDF6A824CC8 = Id FROM Categories WHERE Slug = 'volvo' AND IsDeleted = 0
    IF @parentId_E0DC73705C7B48D58DD0FFDF6A824CC8 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('E0DC7370-5C7B-48D5-8DD0-FFDF6A824CC8', N'V70 II', 'volvo-v70-ii', @parentId_E0DC73705C7B48D58DD0FFDF6A824CC8, NULL, NULL, 5, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volvo-v70-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_B05539D7117A43F69F1A312A29806CA1 uniqueidentifier
    SELECT @parentId_B05539D7117A43F69F1A312A29806CA1 = Id FROM Categories WHERE Slug = 'volvo' AND IsDeleted = 0
    IF @parentId_B05539D7117A43F69F1A312A29806CA1 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('B05539D7-117A-43F6-9F1A-312A29806CA1', N'V70 III', 'volvo-v70-iii', @parentId_B05539D7117A43F69F1A312A29806CA1, NULL, NULL, 6, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volvo-v90-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_C4E78F5197C74604883064A6F4750647 uniqueidentifier
    SELECT @parentId_C4E78F5197C74604883064A6F4750647 = Id FROM Categories WHERE Slug = 'volvo' AND IsDeleted = 0
    IF @parentId_C4E78F5197C74604883064A6F4750647 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('C4E78F51-97C7-4604-8830-64A6F4750647', N'V90 I', 'volvo-v90-i', @parentId_C4E78F5197C74604883064A6F4750647, NULL, NULL, 7, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volvo-v90-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_B05CEEF6BB75412A9A7E2AE1E3E7DCC9 uniqueidentifier
    SELECT @parentId_B05CEEF6BB75412A9A7E2AE1E3E7DCC9 = Id FROM Categories WHERE Slug = 'volvo' AND IsDeleted = 0
    IF @parentId_B05CEEF6BB75412A9A7E2AE1E3E7DCC9 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('B05CEEF6-BB75-412A-9A7E-2AE1E3E7DCC9', N'V90 II', 'volvo-v90-ii', @parentId_B05CEEF6BB75412A9A7E2AE1E3E7DCC9, NULL, NULL, 8, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volvo-s40-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_F7BCBD9199784F2FADD05A3007410368 uniqueidentifier
    SELECT @parentId_F7BCBD9199784F2FADD05A3007410368 = Id FROM Categories WHERE Slug = 'volvo' AND IsDeleted = 0
    IF @parentId_F7BCBD9199784F2FADD05A3007410368 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('F7BCBD91-9978-4F2F-ADD0-5A3007410368', N'S40 I', 'volvo-s40-i', @parentId_F7BCBD9199784F2FADD05A3007410368, NULL, NULL, 9, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volvo-s40-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_8164B5054C61421EAEEC56ABC4E4513F uniqueidentifier
    SELECT @parentId_8164B5054C61421EAEEC56ABC4E4513F = Id FROM Categories WHERE Slug = 'volvo' AND IsDeleted = 0
    IF @parentId_8164B5054C61421EAEEC56ABC4E4513F IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('8164B505-4C61-421E-AEEC-56ABC4E4513F', N'S40 II', 'volvo-s40-ii', @parentId_8164B5054C61421EAEEC56ABC4E4513F, NULL, NULL, 10, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volvo-s60-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_514B22F04D6F4CF4A0C8D1AEB2E9807C uniqueidentifier
    SELECT @parentId_514B22F04D6F4CF4A0C8D1AEB2E9807C = Id FROM Categories WHERE Slug = 'volvo' AND IsDeleted = 0
    IF @parentId_514B22F04D6F4CF4A0C8D1AEB2E9807C IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('514B22F0-4D6F-4CF4-A0C8-D1AEB2E9807C', N'S60 I', 'volvo-s60-i', @parentId_514B22F04D6F4CF4A0C8D1AEB2E9807C, NULL, NULL, 11, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volvo-s60-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_D496FDDCA0E34AE2BC371534D91A2850 uniqueidentifier
    SELECT @parentId_D496FDDCA0E34AE2BC371534D91A2850 = Id FROM Categories WHERE Slug = 'volvo' AND IsDeleted = 0
    IF @parentId_D496FDDCA0E34AE2BC371534D91A2850 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('D496FDDC-A0E3-4AE2-BC37-1534D91A2850', N'S60 II', 'volvo-s60-ii', @parentId_D496FDDCA0E34AE2BC371534D91A2850, NULL, NULL, 12, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volvo-s60-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_CE20B1EDFD7540FCA22183CF557C638D uniqueidentifier
    SELECT @parentId_CE20B1EDFD7540FCA22183CF557C638D = Id FROM Categories WHERE Slug = 'volvo' AND IsDeleted = 0
    IF @parentId_CE20B1EDFD7540FCA22183CF557C638D IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('CE20B1ED-FD75-40FC-A221-83CF557C638D', N'S60 III', 'volvo-s60-iii', @parentId_CE20B1EDFD7540FCA22183CF557C638D, NULL, NULL, 13, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volvo-s80-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_010536E5BD884D9F9783D9E2D623BE3D uniqueidentifier
    SELECT @parentId_010536E5BD884D9F9783D9E2D623BE3D = Id FROM Categories WHERE Slug = 'volvo' AND IsDeleted = 0
    IF @parentId_010536E5BD884D9F9783D9E2D623BE3D IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('010536E5-BD88-4D9F-9783-D9E2D623BE3D', N'S80 I', 'volvo-s80-i', @parentId_010536E5BD884D9F9783D9E2D623BE3D, NULL, NULL, 14, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volvo-s80-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_240F1FCB60CB401CBB668E50F9656B4B uniqueidentifier
    SELECT @parentId_240F1FCB60CB401CBB668E50F9656B4B = Id FROM Categories WHERE Slug = 'volvo' AND IsDeleted = 0
    IF @parentId_240F1FCB60CB401CBB668E50F9656B4B IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('240F1FCB-60CB-401C-BB66-8E50F9656B4B', N'S80 II', 'volvo-s80-ii', @parentId_240F1FCB60CB401CBB668E50F9656B4B, NULL, NULL, 15, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volvo-s90-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_E52E303FB99B484987137CAD24890944 uniqueidentifier
    SELECT @parentId_E52E303FB99B484987137CAD24890944 = Id FROM Categories WHERE Slug = 'volvo' AND IsDeleted = 0
    IF @parentId_E52E303FB99B484987137CAD24890944 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('E52E303F-B99B-4849-8713-7CAD24890944', N'S90 II', 'volvo-s90-ii', @parentId_E52E303FB99B484987137CAD24890944, NULL, NULL, 16, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volvo-xc40' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_02993E1A6C974DF4BE66F397E5D381EC uniqueidentifier
    SELECT @parentId_02993E1A6C974DF4BE66F397E5D381EC = Id FROM Categories WHERE Slug = 'volvo' AND IsDeleted = 0
    IF @parentId_02993E1A6C974DF4BE66F397E5D381EC IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('02993E1A-6C97-4DF4-BE66-F397E5D381EC', N'XC40', 'volvo-xc40', @parentId_02993E1A6C974DF4BE66F397E5D381EC, NULL, NULL, 17, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volvo-xc60-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_618240DA8BEF45518A27E84852E5790B uniqueidentifier
    SELECT @parentId_618240DA8BEF45518A27E84852E5790B = Id FROM Categories WHERE Slug = 'volvo' AND IsDeleted = 0
    IF @parentId_618240DA8BEF45518A27E84852E5790B IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('618240DA-8BEF-4551-8A27-E84852E5790B', N'XC60 I', 'volvo-xc60-i', @parentId_618240DA8BEF45518A27E84852E5790B, NULL, NULL, 18, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volvo-xc60-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_FA51F697091E47498418A3BCD3DBA3F2 uniqueidentifier
    SELECT @parentId_FA51F697091E47498418A3BCD3DBA3F2 = Id FROM Categories WHERE Slug = 'volvo' AND IsDeleted = 0
    IF @parentId_FA51F697091E47498418A3BCD3DBA3F2 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('FA51F697-091E-4749-8418-A3BCD3DBA3F2', N'XC60 II', 'volvo-xc60-ii', @parentId_FA51F697091E47498418A3BCD3DBA3F2, NULL, NULL, 19, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volvo-xc90-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_650043FFAF834C7FB72BF368FC975102 uniqueidentifier
    SELECT @parentId_650043FFAF834C7FB72BF368FC975102 = Id FROM Categories WHERE Slug = 'volvo' AND IsDeleted = 0
    IF @parentId_650043FFAF834C7FB72BF368FC975102 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('650043FF-AF83-4C7F-B72B-F368FC975102', N'XC90 I', 'volvo-xc90-i', @parentId_650043FFAF834C7FB72BF368FC975102, NULL, NULL, 20, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'volvo-xc90-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_F723DFA42A0C4CC58016B4EC5C7B5200 uniqueidentifier
    SELECT @parentId_F723DFA42A0C4CC58016B4EC5C7B5200 = Id FROM Categories WHERE Slug = 'volvo' AND IsDeleted = 0
    IF @parentId_F723DFA42A0C4CC58016B4EC5C7B5200 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('F723DFA4-2A0C-4CC5-8016-B4EC5C7B5200', N'XC90 II', 'volvo-xc90-ii', @parentId_F723DFA42A0C4CC58016B4EC5C7B5200, NULL, NULL, 21, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mitsubishi' AND IsDeleted = 0)
BEGIN
    INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
    VALUES ('D6FD451D-D7DB-4CD8-81B2-06ECB0C15245', N'Mitsubishi', 'mitsubishi', NULL, NULL, NULL, 20, 1, 1, 1, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
ELSE
BEGIN
    -- Varsa ShowInVehicleNav=true gÃ¼ncelle
    UPDATE Categories SET ShowInVehicleNav = 1 WHERE Slug = 'mitsubishi' AND IsDeleted = 0
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mitsubishi-colt-vi' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_94DBB66FF3FC4674B1D8E0D2C559BD5B uniqueidentifier
    SELECT @parentId_94DBB66FF3FC4674B1D8E0D2C559BD5B = Id FROM Categories WHERE Slug = 'mitsubishi' AND IsDeleted = 0
    IF @parentId_94DBB66FF3FC4674B1D8E0D2C559BD5B IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('94DBB66F-F3FC-4674-B1D8-E0D2C559BD5B', N'Colt VI', 'mitsubishi-colt-vi', @parentId_94DBB66FF3FC4674B1D8E0D2C559BD5B, NULL, NULL, 0, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mitsubishi-colt-vii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_38E0960E2B9B47CCA40DD679493639FB uniqueidentifier
    SELECT @parentId_38E0960E2B9B47CCA40DD679493639FB = Id FROM Categories WHERE Slug = 'mitsubishi' AND IsDeleted = 0
    IF @parentId_38E0960E2B9B47CCA40DD679493639FB IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('38E0960E-2B9B-47CC-A40D-D679493639FB', N'Colt VII', 'mitsubishi-colt-vii', @parentId_38E0960E2B9B47CCA40DD679493639FB, NULL, NULL, 1, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mitsubishi-galant-viii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_DA80EF6080BA4ED2B9557D215269186A uniqueidentifier
    SELECT @parentId_DA80EF6080BA4ED2B9557D215269186A = Id FROM Categories WHERE Slug = 'mitsubishi' AND IsDeleted = 0
    IF @parentId_DA80EF6080BA4ED2B9557D215269186A IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('DA80EF60-80BA-4ED2-B955-7D215269186A', N'Galant VIII', 'mitsubishi-galant-viii', @parentId_DA80EF6080BA4ED2B9557D215269186A, NULL, NULL, 2, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mitsubishi-galant-ix' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_0F1F159812414A4C903B47BAC4AEC03B uniqueidentifier
    SELECT @parentId_0F1F159812414A4C903B47BAC4AEC03B = Id FROM Categories WHERE Slug = 'mitsubishi' AND IsDeleted = 0
    IF @parentId_0F1F159812414A4C903B47BAC4AEC03B IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('0F1F1598-1241-4A4C-903B-47BAC4AEC03B', N'Galant IX', 'mitsubishi-galant-ix', @parentId_0F1F159812414A4C903B47BAC4AEC03B, NULL, NULL, 3, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mitsubishi-outlander-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_C2AB7D77578B43AB936F2F8347E5840F uniqueidentifier
    SELECT @parentId_C2AB7D77578B43AB936F2F8347E5840F = Id FROM Categories WHERE Slug = 'mitsubishi' AND IsDeleted = 0
    IF @parentId_C2AB7D77578B43AB936F2F8347E5840F IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('C2AB7D77-578B-43AB-936F-2F8347E5840F', N'Outlander I', 'mitsubishi-outlander-i', @parentId_C2AB7D77578B43AB936F2F8347E5840F, NULL, NULL, 4, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mitsubishi-outlander-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_17E31EAF62084E4B966C5957CECCB4ED uniqueidentifier
    SELECT @parentId_17E31EAF62084E4B966C5957CECCB4ED = Id FROM Categories WHERE Slug = 'mitsubishi' AND IsDeleted = 0
    IF @parentId_17E31EAF62084E4B966C5957CECCB4ED IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('17E31EAF-6208-4E4B-966C-5957CECCB4ED', N'Outlander II', 'mitsubishi-outlander-ii', @parentId_17E31EAF62084E4B966C5957CECCB4ED, NULL, NULL, 5, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mitsubishi-outlander-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_45318784D71748E2BA42D1DB442DAB67 uniqueidentifier
    SELECT @parentId_45318784D71748E2BA42D1DB442DAB67 = Id FROM Categories WHERE Slug = 'mitsubishi' AND IsDeleted = 0
    IF @parentId_45318784D71748E2BA42D1DB442DAB67 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('45318784-D717-48E2-BA42-D1DB442DAB67', N'Outlander III', 'mitsubishi-outlander-iii', @parentId_45318784D71748E2BA42D1DB442DAB67, NULL, NULL, 6, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mitsubishi-eclipse-cross' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_9367DEC6BD5A47E0ADA5E4B4CAA1AEBC uniqueidentifier
    SELECT @parentId_9367DEC6BD5A47E0ADA5E4B4CAA1AEBC = Id FROM Categories WHERE Slug = 'mitsubishi' AND IsDeleted = 0
    IF @parentId_9367DEC6BD5A47E0ADA5E4B4CAA1AEBC IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('9367DEC6-BD5A-47E0-ADA5-E4B4CAA1AEBC', N'Eclipse Cross', 'mitsubishi-eclipse-cross', @parentId_9367DEC6BD5A47E0ADA5E4B4CAA1AEBC, NULL, NULL, 7, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mitsubishi-asx' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_1DDA47987E0D46B7AC22CB0E67F24DAD uniqueidentifier
    SELECT @parentId_1DDA47987E0D46B7AC22CB0E67F24DAD = Id FROM Categories WHERE Slug = 'mitsubishi' AND IsDeleted = 0
    IF @parentId_1DDA47987E0D46B7AC22CB0E67F24DAD IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('1DDA4798-7E0D-46B7-AC22-CB0E67F24DAD', N'ASX', 'mitsubishi-asx', @parentId_1DDA47987E0D46B7AC22CB0E67F24DAD, NULL, NULL, 8, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mitsubishi-l200-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_658B336EAE244058BB138FE1C167CA0F uniqueidentifier
    SELECT @parentId_658B336EAE244058BB138FE1C167CA0F = Id FROM Categories WHERE Slug = 'mitsubishi' AND IsDeleted = 0
    IF @parentId_658B336EAE244058BB138FE1C167CA0F IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('658B336E-AE24-4058-BB13-8FE1C167CA0F', N'L200 III', 'mitsubishi-l200-iii', @parentId_658B336EAE244058BB138FE1C167CA0F, NULL, NULL, 9, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mitsubishi-l200-iv' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_39E79728179F48C6BA2A223D50AF4440 uniqueidentifier
    SELECT @parentId_39E79728179F48C6BA2A223D50AF4440 = Id FROM Categories WHERE Slug = 'mitsubishi' AND IsDeleted = 0
    IF @parentId_39E79728179F48C6BA2A223D50AF4440 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('39E79728-179F-48C6-BA2A-223D50AF4440', N'L200 IV', 'mitsubishi-l200-iv', @parentId_39E79728179F48C6BA2A223D50AF4440, NULL, NULL, 10, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mitsubishi-l200-v' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_81422BE2197D4A6C9853EE120C9C54F1 uniqueidentifier
    SELECT @parentId_81422BE2197D4A6C9853EE120C9C54F1 = Id FROM Categories WHERE Slug = 'mitsubishi' AND IsDeleted = 0
    IF @parentId_81422BE2197D4A6C9853EE120C9C54F1 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('81422BE2-197D-4A6C-9853-EE120C9C54F1', N'L200 V', 'mitsubishi-l200-v', @parentId_81422BE2197D4A6C9853EE120C9C54F1, NULL, NULL, 11, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mitsubishi-pajero-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_FAE9477069EB471C963D1BBD43EE0E0D uniqueidentifier
    SELECT @parentId_FAE9477069EB471C963D1BBD43EE0E0D = Id FROM Categories WHERE Slug = 'mitsubishi' AND IsDeleted = 0
    IF @parentId_FAE9477069EB471C963D1BBD43EE0E0D IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('FAE94770-69EB-471C-963D-1BBD43EE0E0D', N'Pajero III', 'mitsubishi-pajero-iii', @parentId_FAE9477069EB471C963D1BBD43EE0E0D, NULL, NULL, 12, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mitsubishi-pajero-iv' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_0C18EC38FEDF4356A35882113BD03ED2 uniqueidentifier
    SELECT @parentId_0C18EC38FEDF4356A35882113BD03ED2 = Id FROM Categories WHERE Slug = 'mitsubishi' AND IsDeleted = 0
    IF @parentId_0C18EC38FEDF4356A35882113BD03ED2 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('0C18EC38-FEDF-4356-A358-82113BD03ED2', N'Pajero IV', 'mitsubishi-pajero-iv', @parentId_0C18EC38FEDF4356A35882113BD03ED2, NULL, NULL, 13, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'mitsubishi-space-star-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_4749623AE66E424BB6456D3A5DE5A1A9 uniqueidentifier
    SELECT @parentId_4749623AE66E424BB6456D3A5DE5A1A9 = Id FROM Categories WHERE Slug = 'mitsubishi' AND IsDeleted = 0
    IF @parentId_4749623AE66E424BB6456D3A5DE5A1A9 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('4749623A-E66E-424B-B645-6D3A5DE5A1A9', N'Space Star II', 'mitsubishi-space-star-ii', @parentId_4749623AE66E424BB6456D3A5DE5A1A9, NULL, NULL, 14, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'suzuki' AND IsDeleted = 0)
BEGIN
    INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
    VALUES ('F1B899CF-D5E9-4271-8C8E-F843E06EEBD5', N'Suzuki', 'suzuki', NULL, NULL, NULL, 21, 1, 1, 1, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
ELSE
BEGIN
    -- Varsa ShowInVehicleNav=true gÃ¼ncelle
    UPDATE Categories SET ShowInVehicleNav = 1 WHERE Slug = 'suzuki' AND IsDeleted = 0
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'suzuki-swift-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_0333AF6E4BD84731AC746858AC8CD56C uniqueidentifier
    SELECT @parentId_0333AF6E4BD84731AC746858AC8CD56C = Id FROM Categories WHERE Slug = 'suzuki' AND IsDeleted = 0
    IF @parentId_0333AF6E4BD84731AC746858AC8CD56C IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('0333AF6E-4BD8-4731-AC74-6858AC8CD56C', N'Swift I', 'suzuki-swift-i', @parentId_0333AF6E4BD84731AC746858AC8CD56C, NULL, NULL, 0, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'suzuki-swift-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_6D1A7008FC6D4821B45B498FE1B00110 uniqueidentifier
    SELECT @parentId_6D1A7008FC6D4821B45B498FE1B00110 = Id FROM Categories WHERE Slug = 'suzuki' AND IsDeleted = 0
    IF @parentId_6D1A7008FC6D4821B45B498FE1B00110 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('6D1A7008-FC6D-4821-B45B-498FE1B00110', N'Swift II', 'suzuki-swift-ii', @parentId_6D1A7008FC6D4821B45B498FE1B00110, NULL, NULL, 1, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'suzuki-swift-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_6A57458EF34240EE95E7BE4CC5CEEA02 uniqueidentifier
    SELECT @parentId_6A57458EF34240EE95E7BE4CC5CEEA02 = Id FROM Categories WHERE Slug = 'suzuki' AND IsDeleted = 0
    IF @parentId_6A57458EF34240EE95E7BE4CC5CEEA02 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('6A57458E-F342-40EE-95E7-BE4CC5CEEA02', N'Swift III', 'suzuki-swift-iii', @parentId_6A57458EF34240EE95E7BE4CC5CEEA02, NULL, NULL, 2, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'suzuki-swift-iv' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_65EA636ED6AE4BAF95A52960D9BF004F uniqueidentifier
    SELECT @parentId_65EA636ED6AE4BAF95A52960D9BF004F = Id FROM Categories WHERE Slug = 'suzuki' AND IsDeleted = 0
    IF @parentId_65EA636ED6AE4BAF95A52960D9BF004F IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('65EA636E-D6AE-4BAF-95A5-2960D9BF004F', N'Swift IV', 'suzuki-swift-iv', @parentId_65EA636ED6AE4BAF95A52960D9BF004F, NULL, NULL, 3, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'suzuki-swift-v' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_6270C363E99A456DA0BAD6DA63A50D12 uniqueidentifier
    SELECT @parentId_6270C363E99A456DA0BAD6DA63A50D12 = Id FROM Categories WHERE Slug = 'suzuki' AND IsDeleted = 0
    IF @parentId_6270C363E99A456DA0BAD6DA63A50D12 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('6270C363-E99A-456D-A0BA-D6DA63A50D12', N'Swift V', 'suzuki-swift-v', @parentId_6270C363E99A456DA0BAD6DA63A50D12, NULL, NULL, 4, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'suzuki-vitara-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_78B9AC7D522A4D278E8D90CCAA3127C3 uniqueidentifier
    SELECT @parentId_78B9AC7D522A4D278E8D90CCAA3127C3 = Id FROM Categories WHERE Slug = 'suzuki' AND IsDeleted = 0
    IF @parentId_78B9AC7D522A4D278E8D90CCAA3127C3 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('78B9AC7D-522A-4D27-8E8D-90CCAA3127C3', N'Vitara I', 'suzuki-vitara-i', @parentId_78B9AC7D522A4D278E8D90CCAA3127C3, NULL, NULL, 5, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'suzuki-vitara-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_8201054FE14F4F3789963647E39E7A41 uniqueidentifier
    SELECT @parentId_8201054FE14F4F3789963647E39E7A41 = Id FROM Categories WHERE Slug = 'suzuki' AND IsDeleted = 0
    IF @parentId_8201054FE14F4F3789963647E39E7A41 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('8201054F-E14F-4F37-8996-3647E39E7A41', N'Vitara II', 'suzuki-vitara-ii', @parentId_8201054FE14F4F3789963647E39E7A41, NULL, NULL, 6, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'suzuki-vitara-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_398267564EB54A709260788062185426 uniqueidentifier
    SELECT @parentId_398267564EB54A709260788062185426 = Id FROM Categories WHERE Slug = 'suzuki' AND IsDeleted = 0
    IF @parentId_398267564EB54A709260788062185426 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('39826756-4EB5-4A70-9260-788062185426', N'Vitara III', 'suzuki-vitara-iii', @parentId_398267564EB54A709260788062185426, NULL, NULL, 7, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'suzuki-baleno-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_2AD275EE496F4907AD9AC1145208B112 uniqueidentifier
    SELECT @parentId_2AD275EE496F4907AD9AC1145208B112 = Id FROM Categories WHERE Slug = 'suzuki' AND IsDeleted = 0
    IF @parentId_2AD275EE496F4907AD9AC1145208B112 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('2AD275EE-496F-4907-AD9A-C1145208B112', N'Baleno I', 'suzuki-baleno-i', @parentId_2AD275EE496F4907AD9AC1145208B112, NULL, NULL, 8, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'suzuki-baleno-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_62A98E142B5E40169C3644A4D25EECFD uniqueidentifier
    SELECT @parentId_62A98E142B5E40169C3644A4D25EECFD = Id FROM Categories WHERE Slug = 'suzuki' AND IsDeleted = 0
    IF @parentId_62A98E142B5E40169C3644A4D25EECFD IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('62A98E14-2B5E-4016-9C36-44A4D25EECFD', N'Baleno II', 'suzuki-baleno-ii', @parentId_62A98E142B5E40169C3644A4D25EECFD, NULL, NULL, 9, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'suzuki-jimny-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_B1079D4F3C00489F9DA8A677FE89B000 uniqueidentifier
    SELECT @parentId_B1079D4F3C00489F9DA8A677FE89B000 = Id FROM Categories WHERE Slug = 'suzuki' AND IsDeleted = 0
    IF @parentId_B1079D4F3C00489F9DA8A677FE89B000 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('B1079D4F-3C00-489F-9DA8-A677FE89B000', N'Jimny III', 'suzuki-jimny-iii', @parentId_B1079D4F3C00489F9DA8A677FE89B000, NULL, NULL, 10, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'suzuki-jimny-iv' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_5CA8D5ED024647A898044E3CAE4731B7 uniqueidentifier
    SELECT @parentId_5CA8D5ED024647A898044E3CAE4731B7 = Id FROM Categories WHERE Slug = 'suzuki' AND IsDeleted = 0
    IF @parentId_5CA8D5ED024647A898044E3CAE4731B7 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('5CA8D5ED-0246-47A8-9804-4E3CAE4731B7', N'Jimny IV', 'suzuki-jimny-iv', @parentId_5CA8D5ED024647A898044E3CAE4731B7, NULL, NULL, 11, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'suzuki-ignis-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_0188CDD9C25D483E9006FEEFC707673D uniqueidentifier
    SELECT @parentId_0188CDD9C25D483E9006FEEFC707673D = Id FROM Categories WHERE Slug = 'suzuki' AND IsDeleted = 0
    IF @parentId_0188CDD9C25D483E9006FEEFC707673D IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('0188CDD9-C25D-483E-9006-FEEFC707673D', N'Ignis I', 'suzuki-ignis-i', @parentId_0188CDD9C25D483E9006FEEFC707673D, NULL, NULL, 12, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'suzuki-ignis-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_C120898930A64866BE4A9F88B9C1D509 uniqueidentifier
    SELECT @parentId_C120898930A64866BE4A9F88B9C1D509 = Id FROM Categories WHERE Slug = 'suzuki' AND IsDeleted = 0
    IF @parentId_C120898930A64866BE4A9F88B9C1D509 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('C1208989-30A6-4866-BE4A-9F88B9C1D509', N'Ignis II', 'suzuki-ignis-ii', @parentId_C120898930A64866BE4A9F88B9C1D509, NULL, NULL, 13, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'suzuki-s-cross-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_9B88F0282316451296469D1B60EE502F uniqueidentifier
    SELECT @parentId_9B88F0282316451296469D1B60EE502F = Id FROM Categories WHERE Slug = 'suzuki' AND IsDeleted = 0
    IF @parentId_9B88F0282316451296469D1B60EE502F IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('9B88F028-2316-4512-9646-9D1B60EE502F', N'S-Cross I', 'suzuki-s-cross-i', @parentId_9B88F0282316451296469D1B60EE502F, NULL, NULL, 14, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'suzuki-s-cross-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_B4743FF2796E4DB08BF60A93B0F70FC6 uniqueidentifier
    SELECT @parentId_B4743FF2796E4DB08BF60A93B0F70FC6 = Id FROM Categories WHERE Slug = 'suzuki' AND IsDeleted = 0
    IF @parentId_B4743FF2796E4DB08BF60A93B0F70FC6 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('B4743FF2-796E-4DB0-8BF6-0A93B0F70FC6', N'S-Cross II', 'suzuki-s-cross-ii', @parentId_B4743FF2796E4DB08BF60A93B0F70FC6, NULL, NULL, 15, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'suzuki-grand-vitara-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_0D7C16BA767B44C3A6583300CDB9ACBB uniqueidentifier
    SELECT @parentId_0D7C16BA767B44C3A6583300CDB9ACBB = Id FROM Categories WHERE Slug = 'suzuki' AND IsDeleted = 0
    IF @parentId_0D7C16BA767B44C3A6583300CDB9ACBB IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('0D7C16BA-767B-44C3-A658-3300CDB9ACBB', N'Grand Vitara II', 'suzuki-grand-vitara-ii', @parentId_0D7C16BA767B44C3A6583300CDB9ACBB, NULL, NULL, 16, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'suzuki-grand-vitara-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_0ABC2BDA9DDC441C84FF5E646BF836EA uniqueidentifier
    SELECT @parentId_0ABC2BDA9DDC441C84FF5E646BF836EA = Id FROM Categories WHERE Slug = 'suzuki' AND IsDeleted = 0
    IF @parentId_0ABC2BDA9DDC441C84FF5E646BF836EA IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('0ABC2BDA-9DDC-441C-84FF-5E646BF836EA', N'Grand Vitara III', 'suzuki-grand-vitara-iii', @parentId_0ABC2BDA9DDC441C84FF5E646BF836EA, NULL, NULL, 17, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'jeep' AND IsDeleted = 0)
BEGIN
    INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
    VALUES ('DF65EA04-6907-4C58-B82F-49310E7D16C7', N'Jeep', 'jeep', NULL, NULL, NULL, 22, 1, 1, 1, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
ELSE
BEGIN
    -- Varsa ShowInVehicleNav=true gÃ¼ncelle
    UPDATE Categories SET ShowInVehicleNav = 1 WHERE Slug = 'jeep' AND IsDeleted = 0
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'jeep-wrangler-tj' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_DD8A76D56B564CA28CE6C59B2DCD9BE1 uniqueidentifier
    SELECT @parentId_DD8A76D56B564CA28CE6C59B2DCD9BE1 = Id FROM Categories WHERE Slug = 'jeep' AND IsDeleted = 0
    IF @parentId_DD8A76D56B564CA28CE6C59B2DCD9BE1 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('DD8A76D5-6B56-4CA2-8CE6-C59B2DCD9BE1', N'Wrangler TJ', 'jeep-wrangler-tj', @parentId_DD8A76D56B564CA28CE6C59B2DCD9BE1, NULL, NULL, 0, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'jeep-wrangler-jk' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_391EAC843FEA4AAFA2210CB8E5C5348A uniqueidentifier
    SELECT @parentId_391EAC843FEA4AAFA2210CB8E5C5348A = Id FROM Categories WHERE Slug = 'jeep' AND IsDeleted = 0
    IF @parentId_391EAC843FEA4AAFA2210CB8E5C5348A IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('391EAC84-3FEA-4AAF-A221-0CB8E5C5348A', N'Wrangler JK', 'jeep-wrangler-jk', @parentId_391EAC843FEA4AAFA2210CB8E5C5348A, NULL, NULL, 1, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'jeep-wrangler-jl' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_A68025DE77C749718F8C9A219B4AF671 uniqueidentifier
    SELECT @parentId_A68025DE77C749718F8C9A219B4AF671 = Id FROM Categories WHERE Slug = 'jeep' AND IsDeleted = 0
    IF @parentId_A68025DE77C749718F8C9A219B4AF671 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('A68025DE-77C7-4971-8F8C-9A219B4AF671', N'Wrangler JL', 'jeep-wrangler-jl', @parentId_A68025DE77C749718F8C9A219B4AF671, NULL, NULL, 2, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'jeep-cherokee-xj' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_D31E9530ED994F1086AC53664839CFC1 uniqueidentifier
    SELECT @parentId_D31E9530ED994F1086AC53664839CFC1 = Id FROM Categories WHERE Slug = 'jeep' AND IsDeleted = 0
    IF @parentId_D31E9530ED994F1086AC53664839CFC1 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('D31E9530-ED99-4F10-86AC-53664839CFC1', N'Cherokee XJ', 'jeep-cherokee-xj', @parentId_D31E9530ED994F1086AC53664839CFC1, NULL, NULL, 3, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'jeep-cherokee-kj' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_8077BFC3D4B64F8B8A23F79456369A7C uniqueidentifier
    SELECT @parentId_8077BFC3D4B64F8B8A23F79456369A7C = Id FROM Categories WHERE Slug = 'jeep' AND IsDeleted = 0
    IF @parentId_8077BFC3D4B64F8B8A23F79456369A7C IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('8077BFC3-D4B6-4F8B-8A23-F79456369A7C', N'Cherokee KJ', 'jeep-cherokee-kj', @parentId_8077BFC3D4B64F8B8A23F79456369A7C, NULL, NULL, 4, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'jeep-cherokee-kl' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_E803C47F2E854AC0A8229A47544C3D92 uniqueidentifier
    SELECT @parentId_E803C47F2E854AC0A8229A47544C3D92 = Id FROM Categories WHERE Slug = 'jeep' AND IsDeleted = 0
    IF @parentId_E803C47F2E854AC0A8229A47544C3D92 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('E803C47F-2E85-4AC0-A822-9A47544C3D92', N'Cherokee KL', 'jeep-cherokee-kl', @parentId_E803C47F2E854AC0A8229A47544C3D92, NULL, NULL, 5, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'jeep-grand-cherokee-wj' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_E629358EB6FD4EAAB8783F03FEF73F6C uniqueidentifier
    SELECT @parentId_E629358EB6FD4EAAB8783F03FEF73F6C = Id FROM Categories WHERE Slug = 'jeep' AND IsDeleted = 0
    IF @parentId_E629358EB6FD4EAAB8783F03FEF73F6C IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('E629358E-B6FD-4EAA-B878-3F03FEF73F6C', N'Grand Cherokee WJ', 'jeep-grand-cherokee-wj', @parentId_E629358EB6FD4EAAB8783F03FEF73F6C, NULL, NULL, 6, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'jeep-grand-cherokee-wk' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_AFB99348947A44F894B620D56C1A2BB1 uniqueidentifier
    SELECT @parentId_AFB99348947A44F894B620D56C1A2BB1 = Id FROM Categories WHERE Slug = 'jeep' AND IsDeleted = 0
    IF @parentId_AFB99348947A44F894B620D56C1A2BB1 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('AFB99348-947A-44F8-94B6-20D56C1A2BB1', N'Grand Cherokee WK', 'jeep-grand-cherokee-wk', @parentId_AFB99348947A44F894B620D56C1A2BB1, NULL, NULL, 7, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'jeep-grand-cherokee-wk2' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_FB97D2A4F3C24AC0B5E6D1FD4C5F530C uniqueidentifier
    SELECT @parentId_FB97D2A4F3C24AC0B5E6D1FD4C5F530C = Id FROM Categories WHERE Slug = 'jeep' AND IsDeleted = 0
    IF @parentId_FB97D2A4F3C24AC0B5E6D1FD4C5F530C IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('FB97D2A4-F3C2-4AC0-B5E6-D1FD4C5F530C', N'Grand Cherokee WK2', 'jeep-grand-cherokee-wk2', @parentId_FB97D2A4F3C24AC0B5E6D1FD4C5F530C, NULL, NULL, 8, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'jeep-grand-cherokee-wl' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_E0BC727E842844BBA5AE4FCCA770B871 uniqueidentifier
    SELECT @parentId_E0BC727E842844BBA5AE4FCCA770B871 = Id FROM Categories WHERE Slug = 'jeep' AND IsDeleted = 0
    IF @parentId_E0BC727E842844BBA5AE4FCCA770B871 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('E0BC727E-8428-44BB-A5AE-4FCCA770B871', N'Grand Cherokee WL', 'jeep-grand-cherokee-wl', @parentId_E0BC727E842844BBA5AE4FCCA770B871, NULL, NULL, 9, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'jeep-renegade-bu' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_F9E1A2A28C694CBCBCA29E2BC4DCB590 uniqueidentifier
    SELECT @parentId_F9E1A2A28C694CBCBCA29E2BC4DCB590 = Id FROM Categories WHERE Slug = 'jeep' AND IsDeleted = 0
    IF @parentId_F9E1A2A28C694CBCBCA29E2BC4DCB590 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('F9E1A2A2-8C69-4CBC-BCA2-9E2BC4DCB590', N'Renegade BU', 'jeep-renegade-bu', @parentId_F9E1A2A28C694CBCBCA29E2BC4DCB590, NULL, NULL, 10, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'jeep-compass-mk49' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_D41B6A938F8046E59FE90B37C11B2483 uniqueidentifier
    SELECT @parentId_D41B6A938F8046E59FE90B37C11B2483 = Id FROM Categories WHERE Slug = 'jeep' AND IsDeleted = 0
    IF @parentId_D41B6A938F8046E59FE90B37C11B2483 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('D41B6A93-8F80-46E5-9FE9-0B37C11B2483', N'Compass MK49', 'jeep-compass-mk49', @parentId_D41B6A938F8046E59FE90B37C11B2483, NULL, NULL, 11, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'jeep-compass-mp52' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_4C064DDF739A444CA7D444BDFB6B1AA5 uniqueidentifier
    SELECT @parentId_4C064DDF739A444CA7D444BDFB6B1AA5 = Id FROM Categories WHERE Slug = 'jeep' AND IsDeleted = 0
    IF @parentId_4C064DDF739A444CA7D444BDFB6B1AA5 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('4C064DDF-739A-444C-A7D4-44BDFB6B1AA5', N'Compass MP52', 'jeep-compass-mp52', @parentId_4C064DDF739A444CA7D444BDFB6B1AA5, NULL, NULL, 12, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'jeep-commander-xk' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_D1370A38E7A4423480C4119A0CF72F64 uniqueidentifier
    SELECT @parentId_D1370A38E7A4423480C4119A0CF72F64 = Id FROM Categories WHERE Slug = 'jeep' AND IsDeleted = 0
    IF @parentId_D1370A38E7A4423480C4119A0CF72F64 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('D1370A38-E7A4-4234-80C4-119A0CF72F64', N'Commander XK', 'jeep-commander-xk', @parentId_D1370A38E7A4423480C4119A0CF72F64, NULL, NULL, 13, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'jeep-gladiator-jt' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_15A41486139A4444914D177A92A5C88F uniqueidentifier
    SELECT @parentId_15A41486139A4444914D177A92A5C88F = Id FROM Categories WHERE Slug = 'jeep' AND IsDeleted = 0
    IF @parentId_15A41486139A4444914D177A92A5C88F IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('15A41486-139A-4444-914D-177A92A5C88F', N'Gladiator JT', 'jeep-gladiator-jt', @parentId_15A41486139A4444914D177A92A5C88F, NULL, NULL, 14, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'land-rover' AND IsDeleted = 0)
BEGIN
    INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
    VALUES ('A5F68488-36D3-4B2E-BC58-BA14E2E9E4E9', N'Land Rover', 'land-rover', NULL, NULL, NULL, 23, 1, 1, 1, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
ELSE
BEGIN
    -- Varsa ShowInVehicleNav=true gÃ¼ncelle
    UPDATE Categories SET ShowInVehicleNav = 1 WHERE Slug = 'land-rover' AND IsDeleted = 0
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'land-rover-defender-90' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_985D73A815984D1287F575566AC5C4C5 uniqueidentifier
    SELECT @parentId_985D73A815984D1287F575566AC5C4C5 = Id FROM Categories WHERE Slug = 'land-rover' AND IsDeleted = 0
    IF @parentId_985D73A815984D1287F575566AC5C4C5 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('985D73A8-1598-4D12-87F5-75566AC5C4C5', N'Defender 90', 'land-rover-defender-90', @parentId_985D73A815984D1287F575566AC5C4C5, NULL, NULL, 0, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'land-rover-defender-110' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_4C942FB28A0D4326B606C51398A7CD88 uniqueidentifier
    SELECT @parentId_4C942FB28A0D4326B606C51398A7CD88 = Id FROM Categories WHERE Slug = 'land-rover' AND IsDeleted = 0
    IF @parentId_4C942FB28A0D4326B606C51398A7CD88 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('4C942FB2-8A0D-4326-B606-C51398A7CD88', N'Defender 110', 'land-rover-defender-110', @parentId_4C942FB28A0D4326B606C51398A7CD88, NULL, NULL, 1, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'land-rover-defender-l663' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_50A5F08A29144C6ABFCE7205F89602FD uniqueidentifier
    SELECT @parentId_50A5F08A29144C6ABFCE7205F89602FD = Id FROM Categories WHERE Slug = 'land-rover' AND IsDeleted = 0
    IF @parentId_50A5F08A29144C6ABFCE7205F89602FD IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('50A5F08A-2914-4C6A-BFCE-7205F89602FD', N'Defender L663', 'land-rover-defender-l663', @parentId_50A5F08A29144C6ABFCE7205F89602FD, NULL, NULL, 2, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'land-rover-discovery-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_1BFC2C95E65C471799810E33106DA8AC uniqueidentifier
    SELECT @parentId_1BFC2C95E65C471799810E33106DA8AC = Id FROM Categories WHERE Slug = 'land-rover' AND IsDeleted = 0
    IF @parentId_1BFC2C95E65C471799810E33106DA8AC IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('1BFC2C95-E65C-4717-9981-0E33106DA8AC', N'Discovery I', 'land-rover-discovery-i', @parentId_1BFC2C95E65C471799810E33106DA8AC, NULL, NULL, 3, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'land-rover-discovery-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_EC7DBFAA935542A4833E5E28642AE93C uniqueidentifier
    SELECT @parentId_EC7DBFAA935542A4833E5E28642AE93C = Id FROM Categories WHERE Slug = 'land-rover' AND IsDeleted = 0
    IF @parentId_EC7DBFAA935542A4833E5E28642AE93C IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('EC7DBFAA-9355-42A4-833E-5E28642AE93C', N'Discovery II', 'land-rover-discovery-ii', @parentId_EC7DBFAA935542A4833E5E28642AE93C, NULL, NULL, 4, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'land-rover-discovery-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_CB0A0A31FD95465A884306FA02DA3801 uniqueidentifier
    SELECT @parentId_CB0A0A31FD95465A884306FA02DA3801 = Id FROM Categories WHERE Slug = 'land-rover' AND IsDeleted = 0
    IF @parentId_CB0A0A31FD95465A884306FA02DA3801 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('CB0A0A31-FD95-465A-8843-06FA02DA3801', N'Discovery III', 'land-rover-discovery-iii', @parentId_CB0A0A31FD95465A884306FA02DA3801, NULL, NULL, 5, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'land-rover-discovery-iv' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_7E22E6BA35044F4B8F72DA97CED2138C uniqueidentifier
    SELECT @parentId_7E22E6BA35044F4B8F72DA97CED2138C = Id FROM Categories WHERE Slug = 'land-rover' AND IsDeleted = 0
    IF @parentId_7E22E6BA35044F4B8F72DA97CED2138C IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('7E22E6BA-3504-4F4B-8F72-DA97CED2138C', N'Discovery IV', 'land-rover-discovery-iv', @parentId_7E22E6BA35044F4B8F72DA97CED2138C, NULL, NULL, 6, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'land-rover-discovery-v' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_9862543F5EE746858AD4548FC1C7D811 uniqueidentifier
    SELECT @parentId_9862543F5EE746858AD4548FC1C7D811 = Id FROM Categories WHERE Slug = 'land-rover' AND IsDeleted = 0
    IF @parentId_9862543F5EE746858AD4548FC1C7D811 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('9862543F-5EE7-4685-8AD4-548FC1C7D811', N'Discovery V', 'land-rover-discovery-v', @parentId_9862543F5EE746858AD4548FC1C7D811, NULL, NULL, 7, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'land-rover-freelander-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_0BEF0480073A4068A8A3CF3CEE79BE8C uniqueidentifier
    SELECT @parentId_0BEF0480073A4068A8A3CF3CEE79BE8C = Id FROM Categories WHERE Slug = 'land-rover' AND IsDeleted = 0
    IF @parentId_0BEF0480073A4068A8A3CF3CEE79BE8C IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('0BEF0480-073A-4068-A8A3-CF3CEE79BE8C', N'Freelander I', 'land-rover-freelander-i', @parentId_0BEF0480073A4068A8A3CF3CEE79BE8C, NULL, NULL, 8, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'land-rover-freelander-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_90E10F0CFF80433A81FF255344A4DAAD uniqueidentifier
    SELECT @parentId_90E10F0CFF80433A81FF255344A4DAAD = Id FROM Categories WHERE Slug = 'land-rover' AND IsDeleted = 0
    IF @parentId_90E10F0CFF80433A81FF255344A4DAAD IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('90E10F0C-FF80-433A-81FF-255344A4DAAD', N'Freelander II', 'land-rover-freelander-ii', @parentId_90E10F0CFF80433A81FF255344A4DAAD, NULL, NULL, 9, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'land-rover-range-rover-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_48D19C9617184E5A87C50E55154B5648 uniqueidentifier
    SELECT @parentId_48D19C9617184E5A87C50E55154B5648 = Id FROM Categories WHERE Slug = 'land-rover' AND IsDeleted = 0
    IF @parentId_48D19C9617184E5A87C50E55154B5648 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('48D19C96-1718-4E5A-87C5-0E55154B5648', N'Range Rover I', 'land-rover-range-rover-i', @parentId_48D19C9617184E5A87C50E55154B5648, NULL, NULL, 10, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'land-rover-range-rover-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_80A5BB69E10D4B1BB0C8DEB9F03C38D0 uniqueidentifier
    SELECT @parentId_80A5BB69E10D4B1BB0C8DEB9F03C38D0 = Id FROM Categories WHERE Slug = 'land-rover' AND IsDeleted = 0
    IF @parentId_80A5BB69E10D4B1BB0C8DEB9F03C38D0 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('80A5BB69-E10D-4B1B-B0C8-DEB9F03C38D0', N'Range Rover II', 'land-rover-range-rover-ii', @parentId_80A5BB69E10D4B1BB0C8DEB9F03C38D0, NULL, NULL, 11, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'land-rover-range-rover-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_8F172C28434540C9A239839A4B055A20 uniqueidentifier
    SELECT @parentId_8F172C28434540C9A239839A4B055A20 = Id FROM Categories WHERE Slug = 'land-rover' AND IsDeleted = 0
    IF @parentId_8F172C28434540C9A239839A4B055A20 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('8F172C28-4345-40C9-A239-839A4B055A20', N'Range Rover III', 'land-rover-range-rover-iii', @parentId_8F172C28434540C9A239839A4B055A20, NULL, NULL, 12, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'land-rover-range-rover-iv' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_FD07E2368393446EBA2E4BF76C71E2C7 uniqueidentifier
    SELECT @parentId_FD07E2368393446EBA2E4BF76C71E2C7 = Id FROM Categories WHERE Slug = 'land-rover' AND IsDeleted = 0
    IF @parentId_FD07E2368393446EBA2E4BF76C71E2C7 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('FD07E236-8393-446E-BA2E-4BF76C71E2C7', N'Range Rover IV', 'land-rover-range-rover-iv', @parentId_FD07E2368393446EBA2E4BF76C71E2C7, NULL, NULL, 13, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'land-rover-range-rover-v' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_11C9FCEE6B09448E847511912FAC00E9 uniqueidentifier
    SELECT @parentId_11C9FCEE6B09448E847511912FAC00E9 = Id FROM Categories WHERE Slug = 'land-rover' AND IsDeleted = 0
    IF @parentId_11C9FCEE6B09448E847511912FAC00E9 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('11C9FCEE-6B09-448E-8475-11912FAC00E9', N'Range Rover V', 'land-rover-range-rover-v', @parentId_11C9FCEE6B09448E847511912FAC00E9, NULL, NULL, 14, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'land-rover-range-rover-sport-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_B03055BA34CA4E0080328876BF3F0AE7 uniqueidentifier
    SELECT @parentId_B03055BA34CA4E0080328876BF3F0AE7 = Id FROM Categories WHERE Slug = 'land-rover' AND IsDeleted = 0
    IF @parentId_B03055BA34CA4E0080328876BF3F0AE7 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('B03055BA-34CA-4E00-8032-8876BF3F0AE7', N'Range Rover Sport I', 'land-rover-range-rover-sport-i', @parentId_B03055BA34CA4E0080328876BF3F0AE7, NULL, NULL, 15, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'land-rover-range-rover-sport-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_58FB3E2DAED747039B91BAC4F7BBBE12 uniqueidentifier
    SELECT @parentId_58FB3E2DAED747039B91BAC4F7BBBE12 = Id FROM Categories WHERE Slug = 'land-rover' AND IsDeleted = 0
    IF @parentId_58FB3E2DAED747039B91BAC4F7BBBE12 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('58FB3E2D-AED7-4703-9B91-BAC4F7BBBE12', N'Range Rover Sport II', 'land-rover-range-rover-sport-ii', @parentId_58FB3E2DAED747039B91BAC4F7BBBE12, NULL, NULL, 16, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'land-rover-range-rover-evoque-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_4B0C57F459AA4736B10BC6F30460CD6E uniqueidentifier
    SELECT @parentId_4B0C57F459AA4736B10BC6F30460CD6E = Id FROM Categories WHERE Slug = 'land-rover' AND IsDeleted = 0
    IF @parentId_4B0C57F459AA4736B10BC6F30460CD6E IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('4B0C57F4-59AA-4736-B10B-C6F30460CD6E', N'Range Rover Evoque I', 'land-rover-range-rover-evoque-i', @parentId_4B0C57F459AA4736B10BC6F30460CD6E, NULL, NULL, 17, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'land-rover-range-rover-evoque-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_DBBDADC9BD394BDA8C6A3D5ED3EBB153 uniqueidentifier
    SELECT @parentId_DBBDADC9BD394BDA8C6A3D5ED3EBB153 = Id FROM Categories WHERE Slug = 'land-rover' AND IsDeleted = 0
    IF @parentId_DBBDADC9BD394BDA8C6A3D5ED3EBB153 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('DBBDADC9-BD39-4BDA-8C6A-3D5ED3EBB153', N'Range Rover Evoque II', 'land-rover-range-rover-evoque-ii', @parentId_DBBDADC9BD394BDA8C6A3D5ED3EBB153, NULL, NULL, 18, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'land-rover-velar' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_1B3BA3855B464C988DF57CF1CAC2F5F5 uniqueidentifier
    SELECT @parentId_1B3BA3855B464C988DF57CF1CAC2F5F5 = Id FROM Categories WHERE Slug = 'land-rover' AND IsDeleted = 0
    IF @parentId_1B3BA3855B464C988DF57CF1CAC2F5F5 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('1B3BA385-5B46-4C98-8DF5-7CF1CAC2F5F5', N'Velar', 'land-rover-velar', @parentId_1B3BA3855B464C988DF57CF1CAC2F5F5, NULL, NULL, 19, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'alfa-romeo' AND IsDeleted = 0)
BEGIN
    INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
    VALUES ('5F60DEC1-0BC3-41F8-8A81-5C403636803E', N'Alfa Romeo', 'alfa-romeo', NULL, NULL, NULL, 24, 1, 1, 1, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
ELSE
BEGIN
    -- Varsa ShowInVehicleNav=true gÃ¼ncelle
    UPDATE Categories SET ShowInVehicleNav = 1 WHERE Slug = 'alfa-romeo' AND IsDeleted = 0
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'alfa-romeo-giulia-952' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_51687C8FADE845909394B7B67E3402FF uniqueidentifier
    SELECT @parentId_51687C8FADE845909394B7B67E3402FF = Id FROM Categories WHERE Slug = 'alfa-romeo' AND IsDeleted = 0
    IF @parentId_51687C8FADE845909394B7B67E3402FF IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('51687C8F-ADE8-4590-9394-B7B67E3402FF', N'Giulia 952', 'alfa-romeo-giulia-952', @parentId_51687C8FADE845909394B7B67E3402FF, NULL, NULL, 0, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'alfa-romeo-stelvio-949' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_57B00DD6217A4FAE8F95A1A413753020 uniqueidentifier
    SELECT @parentId_57B00DD6217A4FAE8F95A1A413753020 = Id FROM Categories WHERE Slug = 'alfa-romeo' AND IsDeleted = 0
    IF @parentId_57B00DD6217A4FAE8F95A1A413753020 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('57B00DD6-217A-4FAE-8F95-A1A413753020', N'Stelvio 949', 'alfa-romeo-stelvio-949', @parentId_57B00DD6217A4FAE8F95A1A413753020, NULL, NULL, 1, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'alfa-romeo-giulietta-940' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_761BD917978A49CB9679EE8C913435A4 uniqueidentifier
    SELECT @parentId_761BD917978A49CB9679EE8C913435A4 = Id FROM Categories WHERE Slug = 'alfa-romeo' AND IsDeleted = 0
    IF @parentId_761BD917978A49CB9679EE8C913435A4 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('761BD917-978A-49CB-9679-EE8C913435A4', N'Giulietta 940', 'alfa-romeo-giulietta-940', @parentId_761BD917978A49CB9679EE8C913435A4, NULL, NULL, 2, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'alfa-romeo-mito-955' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_E1F6F1FC1BAE4217A6B27BBE1733A34D uniqueidentifier
    SELECT @parentId_E1F6F1FC1BAE4217A6B27BBE1733A34D = Id FROM Categories WHERE Slug = 'alfa-romeo' AND IsDeleted = 0
    IF @parentId_E1F6F1FC1BAE4217A6B27BBE1733A34D IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('E1F6F1FC-1BAE-4217-A6B2-7BBE1733A34D', N'MiTo 955', 'alfa-romeo-mito-955', @parentId_E1F6F1FC1BAE4217A6B27BBE1733A34D, NULL, NULL, 3, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'alfa-romeo-147-937' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_4C6493D33A554161925B9D6E44B5C46D uniqueidentifier
    SELECT @parentId_4C6493D33A554161925B9D6E44B5C46D = Id FROM Categories WHERE Slug = 'alfa-romeo' AND IsDeleted = 0
    IF @parentId_4C6493D33A554161925B9D6E44B5C46D IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('4C6493D3-3A55-4161-925B-9D6E44B5C46D', N'147 937', 'alfa-romeo-147-937', @parentId_4C6493D33A554161925B9D6E44B5C46D, NULL, NULL, 4, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'alfa-romeo-156-932' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_F708E829B71A4A258AC52A339ED5B513 uniqueidentifier
    SELECT @parentId_F708E829B71A4A258AC52A339ED5B513 = Id FROM Categories WHERE Slug = 'alfa-romeo' AND IsDeleted = 0
    IF @parentId_F708E829B71A4A258AC52A339ED5B513 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('F708E829-B71A-4A25-8AC5-2A339ED5B513', N'156 932', 'alfa-romeo-156-932', @parentId_F708E829B71A4A258AC52A339ED5B513, NULL, NULL, 5, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'alfa-romeo-159-939' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_7037B47682E846B985B32C67594A883B uniqueidentifier
    SELECT @parentId_7037B47682E846B985B32C67594A883B = Id FROM Categories WHERE Slug = 'alfa-romeo' AND IsDeleted = 0
    IF @parentId_7037B47682E846B985B32C67594A883B IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('7037B476-82E8-46B9-85B3-2C67594A883B', N'159 939', 'alfa-romeo-159-939', @parentId_7037B47682E846B985B32C67594A883B, NULL, NULL, 6, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'alfa-romeo-brera-939' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_6157983FF6C04C5BA092E786A545E366 uniqueidentifier
    SELECT @parentId_6157983FF6C04C5BA092E786A545E366 = Id FROM Categories WHERE Slug = 'alfa-romeo' AND IsDeleted = 0
    IF @parentId_6157983FF6C04C5BA092E786A545E366 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('6157983F-F6C0-4C5B-A092-E786A545E366', N'Brera 939', 'alfa-romeo-brera-939', @parentId_6157983FF6C04C5BA092E786A545E366, NULL, NULL, 7, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'dacia' AND IsDeleted = 0)
BEGIN
    INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
    VALUES ('AD420AEE-F076-4929-ADEA-43422891451E', N'Dacia', 'dacia', NULL, NULL, NULL, 25, 1, 1, 1, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
ELSE
BEGIN
    -- Varsa ShowInVehicleNav=true gÃ¼ncelle
    UPDATE Categories SET ShowInVehicleNav = 1 WHERE Slug = 'dacia' AND IsDeleted = 0
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'dacia-sandero-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_51B1BFA2E61F4EA09064C4C68E0D7EB1 uniqueidentifier
    SELECT @parentId_51B1BFA2E61F4EA09064C4C68E0D7EB1 = Id FROM Categories WHERE Slug = 'dacia' AND IsDeleted = 0
    IF @parentId_51B1BFA2E61F4EA09064C4C68E0D7EB1 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('51B1BFA2-E61F-4EA0-9064-C4C68E0D7EB1', N'Sandero I', 'dacia-sandero-i', @parentId_51B1BFA2E61F4EA09064C4C68E0D7EB1, NULL, NULL, 0, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'dacia-sandero-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_5CED40E6FF6C4055B1984DC673333FDB uniqueidentifier
    SELECT @parentId_5CED40E6FF6C4055B1984DC673333FDB = Id FROM Categories WHERE Slug = 'dacia' AND IsDeleted = 0
    IF @parentId_5CED40E6FF6C4055B1984DC673333FDB IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('5CED40E6-FF6C-4055-B198-4DC673333FDB', N'Sandero II', 'dacia-sandero-ii', @parentId_5CED40E6FF6C4055B1984DC673333FDB, NULL, NULL, 1, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'dacia-sandero-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_75A98982ADB941CE9DE89739293AAC26 uniqueidentifier
    SELECT @parentId_75A98982ADB941CE9DE89739293AAC26 = Id FROM Categories WHERE Slug = 'dacia' AND IsDeleted = 0
    IF @parentId_75A98982ADB941CE9DE89739293AAC26 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('75A98982-ADB9-41CE-9DE8-9739293AAC26', N'Sandero III', 'dacia-sandero-iii', @parentId_75A98982ADB941CE9DE89739293AAC26, NULL, NULL, 2, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'dacia-logan-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_BDDE9743FBBC4B64A3120F5E9D2DC44A uniqueidentifier
    SELECT @parentId_BDDE9743FBBC4B64A3120F5E9D2DC44A = Id FROM Categories WHERE Slug = 'dacia' AND IsDeleted = 0
    IF @parentId_BDDE9743FBBC4B64A3120F5E9D2DC44A IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('BDDE9743-FBBC-4B64-A312-0F5E9D2DC44A', N'Logan I', 'dacia-logan-i', @parentId_BDDE9743FBBC4B64A3120F5E9D2DC44A, NULL, NULL, 3, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'dacia-logan-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_05CA9C795ACE467DB2D845DA126AE209 uniqueidentifier
    SELECT @parentId_05CA9C795ACE467DB2D845DA126AE209 = Id FROM Categories WHERE Slug = 'dacia' AND IsDeleted = 0
    IF @parentId_05CA9C795ACE467DB2D845DA126AE209 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('05CA9C79-5ACE-467D-B2D8-45DA126AE209', N'Logan II', 'dacia-logan-ii', @parentId_05CA9C795ACE467DB2D845DA126AE209, NULL, NULL, 4, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'dacia-logan-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_8FDE467CD54C4857A222E26F575DAC24 uniqueidentifier
    SELECT @parentId_8FDE467CD54C4857A222E26F575DAC24 = Id FROM Categories WHERE Slug = 'dacia' AND IsDeleted = 0
    IF @parentId_8FDE467CD54C4857A222E26F575DAC24 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('8FDE467C-D54C-4857-A222-E26F575DAC24', N'Logan III', 'dacia-logan-iii', @parentId_8FDE467CD54C4857A222E26F575DAC24, NULL, NULL, 5, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'dacia-duster-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_524762EB15C04776BE19C9801DA9465D uniqueidentifier
    SELECT @parentId_524762EB15C04776BE19C9801DA9465D = Id FROM Categories WHERE Slug = 'dacia' AND IsDeleted = 0
    IF @parentId_524762EB15C04776BE19C9801DA9465D IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('524762EB-15C0-4776-BE19-C9801DA9465D', N'Duster I', 'dacia-duster-i', @parentId_524762EB15C04776BE19C9801DA9465D, NULL, NULL, 6, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'dacia-duster-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_C17706DD9C744E7D99BB137DF4FD504F uniqueidentifier
    SELECT @parentId_C17706DD9C744E7D99BB137DF4FD504F = Id FROM Categories WHERE Slug = 'dacia' AND IsDeleted = 0
    IF @parentId_C17706DD9C744E7D99BB137DF4FD504F IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('C17706DD-9C74-4E7D-99BB-137DF4FD504F', N'Duster II', 'dacia-duster-ii', @parentId_C17706DD9C744E7D99BB137DF4FD504F, NULL, NULL, 7, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'dacia-duster-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_85507FF3CA7E46F59573E13B5BF8B178 uniqueidentifier
    SELECT @parentId_85507FF3CA7E46F59573E13B5BF8B178 = Id FROM Categories WHERE Slug = 'dacia' AND IsDeleted = 0
    IF @parentId_85507FF3CA7E46F59573E13B5BF8B178 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('85507FF3-CA7E-46F5-9573-E13B5BF8B178', N'Duster III', 'dacia-duster-iii', @parentId_85507FF3CA7E46F59573E13B5BF8B178, NULL, NULL, 8, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'dacia-lodgy' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_FB6D80C519CF4555A01D3B08DF3FF313 uniqueidentifier
    SELECT @parentId_FB6D80C519CF4555A01D3B08DF3FF313 = Id FROM Categories WHERE Slug = 'dacia' AND IsDeleted = 0
    IF @parentId_FB6D80C519CF4555A01D3B08DF3FF313 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('FB6D80C5-19CF-4555-A01D-3B08DF3FF313', N'Lodgy', 'dacia-lodgy', @parentId_FB6D80C519CF4555A01D3B08DF3FF313, NULL, NULL, 9, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'dacia-dokker' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_BBBD71516AE44D43B7599E80A6BDE40A uniqueidentifier
    SELECT @parentId_BBBD71516AE44D43B7599E80A6BDE40A = Id FROM Categories WHERE Slug = 'dacia' AND IsDeleted = 0
    IF @parentId_BBBD71516AE44D43B7599E80A6BDE40A IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('BBBD7151-6AE4-4D43-B759-9E80A6BDE40A', N'Dokker', 'dacia-dokker', @parentId_BBBD71516AE44D43B7599E80A6BDE40A, NULL, NULL, 10, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'dacia-spring' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_61B11C1547BB4992913049D1E696D297 uniqueidentifier
    SELECT @parentId_61B11C1547BB4992913049D1E696D297 = Id FROM Categories WHERE Slug = 'dacia' AND IsDeleted = 0
    IF @parentId_61B11C1547BB4992913049D1E696D297 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('61B11C15-47BB-4992-9130-49D1E696D297', N'Spring', 'dacia-spring', @parentId_61B11C1547BB4992913049D1E696D297, NULL, NULL, 11, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'porsche' AND IsDeleted = 0)
BEGIN
    INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
    VALUES ('4CB05906-1197-4CD5-A6C2-A697EAA2B87B', N'Porsche', 'porsche', NULL, NULL, NULL, 26, 1, 1, 1, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
ELSE
BEGIN
    -- Varsa ShowInVehicleNav=true gÃ¼ncelle
    UPDATE Categories SET ShowInVehicleNav = 1 WHERE Slug = 'porsche' AND IsDeleted = 0
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'porsche-911-996' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_5F3D567C54D14C718105E700E71194D2 uniqueidentifier
    SELECT @parentId_5F3D567C54D14C718105E700E71194D2 = Id FROM Categories WHERE Slug = 'porsche' AND IsDeleted = 0
    IF @parentId_5F3D567C54D14C718105E700E71194D2 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('5F3D567C-54D1-4C71-8105-E700E71194D2', N'911 996', 'porsche-911-996', @parentId_5F3D567C54D14C718105E700E71194D2, NULL, NULL, 0, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'porsche-911-997' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_26B034389E1A459FA73AE77B69BD12A2 uniqueidentifier
    SELECT @parentId_26B034389E1A459FA73AE77B69BD12A2 = Id FROM Categories WHERE Slug = 'porsche' AND IsDeleted = 0
    IF @parentId_26B034389E1A459FA73AE77B69BD12A2 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('26B03438-9E1A-459F-A73A-E77B69BD12A2', N'911 997', 'porsche-911-997', @parentId_26B034389E1A459FA73AE77B69BD12A2, NULL, NULL, 1, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'porsche-911-991' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_72818C9A48A44CCAA1B34AF5DCD37464 uniqueidentifier
    SELECT @parentId_72818C9A48A44CCAA1B34AF5DCD37464 = Id FROM Categories WHERE Slug = 'porsche' AND IsDeleted = 0
    IF @parentId_72818C9A48A44CCAA1B34AF5DCD37464 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('72818C9A-48A4-4CCA-A1B3-4AF5DCD37464', N'911 991', 'porsche-911-991', @parentId_72818C9A48A44CCAA1B34AF5DCD37464, NULL, NULL, 2, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'porsche-911-992' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_6CF29ED8667241D49E313C0952C1ED93 uniqueidentifier
    SELECT @parentId_6CF29ED8667241D49E313C0952C1ED93 = Id FROM Categories WHERE Slug = 'porsche' AND IsDeleted = 0
    IF @parentId_6CF29ED8667241D49E313C0952C1ED93 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('6CF29ED8-6672-41D4-9E31-3C0952C1ED93', N'911 992', 'porsche-911-992', @parentId_6CF29ED8667241D49E313C0952C1ED93, NULL, NULL, 3, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'porsche-cayenne-9pa' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_6611A51D8A2F4965AD24AE24DB0CD4C2 uniqueidentifier
    SELECT @parentId_6611A51D8A2F4965AD24AE24DB0CD4C2 = Id FROM Categories WHERE Slug = 'porsche' AND IsDeleted = 0
    IF @parentId_6611A51D8A2F4965AD24AE24DB0CD4C2 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('6611A51D-8A2F-4965-AD24-AE24DB0CD4C2', N'Cayenne 9PA', 'porsche-cayenne-9pa', @parentId_6611A51D8A2F4965AD24AE24DB0CD4C2, NULL, NULL, 4, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'porsche-cayenne-92a' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_0B345FB89C724F9FAF79C2027086D719 uniqueidentifier
    SELECT @parentId_0B345FB89C724F9FAF79C2027086D719 = Id FROM Categories WHERE Slug = 'porsche' AND IsDeleted = 0
    IF @parentId_0B345FB89C724F9FAF79C2027086D719 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('0B345FB8-9C72-4F9F-AF79-C2027086D719', N'Cayenne 92A', 'porsche-cayenne-92a', @parentId_0B345FB89C724F9FAF79C2027086D719, NULL, NULL, 5, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'porsche-cayenne-e3' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_C78CB0079F39489C8F1E1EC54166BBF0 uniqueidentifier
    SELECT @parentId_C78CB0079F39489C8F1E1EC54166BBF0 = Id FROM Categories WHERE Slug = 'porsche' AND IsDeleted = 0
    IF @parentId_C78CB0079F39489C8F1E1EC54166BBF0 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('C78CB007-9F39-489C-8F1E-1EC54166BBF0', N'Cayenne E3', 'porsche-cayenne-e3', @parentId_C78CB0079F39489C8F1E1EC54166BBF0, NULL, NULL, 6, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'porsche-macan-95b' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_855C0062EE334C90AAFE9CC88109E244 uniqueidentifier
    SELECT @parentId_855C0062EE334C90AAFE9CC88109E244 = Id FROM Categories WHERE Slug = 'porsche' AND IsDeleted = 0
    IF @parentId_855C0062EE334C90AAFE9CC88109E244 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('855C0062-EE33-4C90-AAFE-9CC88109E244', N'Macan 95B', 'porsche-macan-95b', @parentId_855C0062EE334C90AAFE9CC88109E244, NULL, NULL, 7, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'porsche-panamera-970' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_4EA5EA25706E4DCDA62548FC9F8DDB04 uniqueidentifier
    SELECT @parentId_4EA5EA25706E4DCDA62548FC9F8DDB04 = Id FROM Categories WHERE Slug = 'porsche' AND IsDeleted = 0
    IF @parentId_4EA5EA25706E4DCDA62548FC9F8DDB04 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('4EA5EA25-706E-4DCD-A625-48FC9F8DDB04', N'Panamera 970', 'porsche-panamera-970', @parentId_4EA5EA25706E4DCDA62548FC9F8DDB04, NULL, NULL, 8, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'porsche-panamera-971' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_D3C068B792F44E8FAD03F49C738A6838 uniqueidentifier
    SELECT @parentId_D3C068B792F44E8FAD03F49C738A6838 = Id FROM Categories WHERE Slug = 'porsche' AND IsDeleted = 0
    IF @parentId_D3C068B792F44E8FAD03F49C738A6838 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('D3C068B7-92F4-4E8F-AD03-F49C738A6838', N'Panamera 971', 'porsche-panamera-971', @parentId_D3C068B792F44E8FAD03F49C738A6838, NULL, NULL, 9, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'porsche-boxster-986' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_53E3DD5AAD40487A99114FE599F2311E uniqueidentifier
    SELECT @parentId_53E3DD5AAD40487A99114FE599F2311E = Id FROM Categories WHERE Slug = 'porsche' AND IsDeleted = 0
    IF @parentId_53E3DD5AAD40487A99114FE599F2311E IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('53E3DD5A-AD40-487A-9911-4FE599F2311E', N'Boxster 986', 'porsche-boxster-986', @parentId_53E3DD5AAD40487A99114FE599F2311E, NULL, NULL, 10, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'porsche-boxster-987' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_DC622778E95D4816A99A80C395B15AA2 uniqueidentifier
    SELECT @parentId_DC622778E95D4816A99A80C395B15AA2 = Id FROM Categories WHERE Slug = 'porsche' AND IsDeleted = 0
    IF @parentId_DC622778E95D4816A99A80C395B15AA2 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('DC622778-E95D-4816-A99A-80C395B15AA2', N'Boxster 987', 'porsche-boxster-987', @parentId_DC622778E95D4816A99A80C395B15AA2, NULL, NULL, 11, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'porsche-boxster-981' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_07696E1A7B1B4320886DC1C41DFF53E0 uniqueidentifier
    SELECT @parentId_07696E1A7B1B4320886DC1C41DFF53E0 = Id FROM Categories WHERE Slug = 'porsche' AND IsDeleted = 0
    IF @parentId_07696E1A7B1B4320886DC1C41DFF53E0 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('07696E1A-7B1B-4320-886D-C1C41DFF53E0', N'Boxster 981', 'porsche-boxster-981', @parentId_07696E1A7B1B4320886DC1C41DFF53E0, NULL, NULL, 12, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'porsche-boxster-982' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_7558CD4575B54AF9BE8D49FA65361933 uniqueidentifier
    SELECT @parentId_7558CD4575B54AF9BE8D49FA65361933 = Id FROM Categories WHERE Slug = 'porsche' AND IsDeleted = 0
    IF @parentId_7558CD4575B54AF9BE8D49FA65361933 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('7558CD45-75B5-4AF9-BE8D-49FA65361933', N'Boxster 982', 'porsche-boxster-982', @parentId_7558CD4575B54AF9BE8D49FA65361933, NULL, NULL, 13, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'porsche-cayman-987' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_F866228BE6F44C25A0625A0EA70E80BD uniqueidentifier
    SELECT @parentId_F866228BE6F44C25A0625A0EA70E80BD = Id FROM Categories WHERE Slug = 'porsche' AND IsDeleted = 0
    IF @parentId_F866228BE6F44C25A0625A0EA70E80BD IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('F866228B-E6F4-4C25-A062-5A0EA70E80BD', N'Cayman 987', 'porsche-cayman-987', @parentId_F866228BE6F44C25A0625A0EA70E80BD, NULL, NULL, 14, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'porsche-cayman-981' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_28B0268AE2B049C3831991CE8E6AD809 uniqueidentifier
    SELECT @parentId_28B0268AE2B049C3831991CE8E6AD809 = Id FROM Categories WHERE Slug = 'porsche' AND IsDeleted = 0
    IF @parentId_28B0268AE2B049C3831991CE8E6AD809 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('28B0268A-E2B0-49C3-8319-91CE8E6AD809', N'Cayman 981', 'porsche-cayman-981', @parentId_28B0268AE2B049C3831991CE8E6AD809, NULL, NULL, 15, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'porsche-taycan' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_77BBDC750ADF4308A55C2483A1787349 uniqueidentifier
    SELECT @parentId_77BBDC750ADF4308A55C2483A1787349 = Id FROM Categories WHERE Slug = 'porsche' AND IsDeleted = 0
    IF @parentId_77BBDC750ADF4308A55C2483A1787349 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('77BBDC75-0ADF-4308-A55C-2483A1787349', N'Taycan', 'porsche-taycan', @parentId_77BBDC750ADF4308A55C2483A1787349, NULL, NULL, 16, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'subaru' AND IsDeleted = 0)
BEGIN
    INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
    VALUES ('7392A9EE-FCE2-4D68-A6ED-4094A1A13021', N'Subaru', 'subaru', NULL, NULL, NULL, 27, 1, 1, 1, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
ELSE
BEGIN
    -- Varsa ShowInVehicleNav=true gÃ¼ncelle
    UPDATE Categories SET ShowInVehicleNav = 1 WHERE Slug = 'subaru' AND IsDeleted = 0
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'subaru-impreza-gc' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_ED693FE940D4410CAF5B0ADACC186D33 uniqueidentifier
    SELECT @parentId_ED693FE940D4410CAF5B0ADACC186D33 = Id FROM Categories WHERE Slug = 'subaru' AND IsDeleted = 0
    IF @parentId_ED693FE940D4410CAF5B0ADACC186D33 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('ED693FE9-40D4-410C-AF5B-0ADACC186D33', N'Impreza GC', 'subaru-impreza-gc', @parentId_ED693FE940D4410CAF5B0ADACC186D33, NULL, NULL, 0, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'subaru-impreza-gd' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_5EB1031A9A0248B083DE2A5A9BF45DAD uniqueidentifier
    SELECT @parentId_5EB1031A9A0248B083DE2A5A9BF45DAD = Id FROM Categories WHERE Slug = 'subaru' AND IsDeleted = 0
    IF @parentId_5EB1031A9A0248B083DE2A5A9BF45DAD IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('5EB1031A-9A02-48B0-83DE-2A5A9BF45DAD', N'Impreza GD', 'subaru-impreza-gd', @parentId_5EB1031A9A0248B083DE2A5A9BF45DAD, NULL, NULL, 1, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'subaru-impreza-ge' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_64AC342C083442ECB34FC772DD45690D uniqueidentifier
    SELECT @parentId_64AC342C083442ECB34FC772DD45690D = Id FROM Categories WHERE Slug = 'subaru' AND IsDeleted = 0
    IF @parentId_64AC342C083442ECB34FC772DD45690D IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('64AC342C-0834-42EC-B34F-C772DD45690D', N'Impreza GE', 'subaru-impreza-ge', @parentId_64AC342C083442ECB34FC772DD45690D, NULL, NULL, 2, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'subaru-impreza-gp' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_666B4DE600364107BE18F4A0FD1B5285 uniqueidentifier
    SELECT @parentId_666B4DE600364107BE18F4A0FD1B5285 = Id FROM Categories WHERE Slug = 'subaru' AND IsDeleted = 0
    IF @parentId_666B4DE600364107BE18F4A0FD1B5285 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('666B4DE6-0036-4107-BE18-F4A0FD1B5285', N'Impreza GP', 'subaru-impreza-gp', @parentId_666B4DE600364107BE18F4A0FD1B5285, NULL, NULL, 3, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'subaru-impreza-gj' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_1B2346E597634DB1B4DD8B8D8621832A uniqueidentifier
    SELECT @parentId_1B2346E597634DB1B4DD8B8D8621832A = Id FROM Categories WHERE Slug = 'subaru' AND IsDeleted = 0
    IF @parentId_1B2346E597634DB1B4DD8B8D8621832A IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('1B2346E5-9763-4DB1-B4DD-8B8D8621832A', N'Impreza GJ', 'subaru-impreza-gj', @parentId_1B2346E597634DB1B4DD8B8D8621832A, NULL, NULL, 4, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'subaru-impreza-gt' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_A04D32F308BD438CB2BBDE1A07491979 uniqueidentifier
    SELECT @parentId_A04D32F308BD438CB2BBDE1A07491979 = Id FROM Categories WHERE Slug = 'subaru' AND IsDeleted = 0
    IF @parentId_A04D32F308BD438CB2BBDE1A07491979 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('A04D32F3-08BD-438C-B2BB-DE1A07491979', N'Impreza GT', 'subaru-impreza-gt', @parentId_A04D32F308BD438CB2BBDE1A07491979, NULL, NULL, 5, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'subaru-legacy-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_8A2019AB83AB454D9C70FB3110BF1DEF uniqueidentifier
    SELECT @parentId_8A2019AB83AB454D9C70FB3110BF1DEF = Id FROM Categories WHERE Slug = 'subaru' AND IsDeleted = 0
    IF @parentId_8A2019AB83AB454D9C70FB3110BF1DEF IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('8A2019AB-83AB-454D-9C70-FB3110BF1DEF', N'Legacy III', 'subaru-legacy-iii', @parentId_8A2019AB83AB454D9C70FB3110BF1DEF, NULL, NULL, 6, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'subaru-legacy-iv' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_2E1FB1B40BEA4046B51F057BD26F00ED uniqueidentifier
    SELECT @parentId_2E1FB1B40BEA4046B51F057BD26F00ED = Id FROM Categories WHERE Slug = 'subaru' AND IsDeleted = 0
    IF @parentId_2E1FB1B40BEA4046B51F057BD26F00ED IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('2E1FB1B4-0BEA-4046-B51F-057BD26F00ED', N'Legacy IV', 'subaru-legacy-iv', @parentId_2E1FB1B40BEA4046B51F057BD26F00ED, NULL, NULL, 7, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'subaru-legacy-v' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_3265C0FC70ED423F82328B3B7EF3DDD2 uniqueidentifier
    SELECT @parentId_3265C0FC70ED423F82328B3B7EF3DDD2 = Id FROM Categories WHERE Slug = 'subaru' AND IsDeleted = 0
    IF @parentId_3265C0FC70ED423F82328B3B7EF3DDD2 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('3265C0FC-70ED-423F-8232-8B3B7EF3DDD2', N'Legacy V', 'subaru-legacy-v', @parentId_3265C0FC70ED423F82328B3B7EF3DDD2, NULL, NULL, 8, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'subaru-outback-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_784BF06AC4834E868E0B6518F7B2CADE uniqueidentifier
    SELECT @parentId_784BF06AC4834E868E0B6518F7B2CADE = Id FROM Categories WHERE Slug = 'subaru' AND IsDeleted = 0
    IF @parentId_784BF06AC4834E868E0B6518F7B2CADE IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('784BF06A-C483-4E86-8E0B-6518F7B2CADE', N'Outback II', 'subaru-outback-ii', @parentId_784BF06AC4834E868E0B6518F7B2CADE, NULL, NULL, 9, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'subaru-outback-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_500BA1925D9F48F48556DCEB1C1F7DA7 uniqueidentifier
    SELECT @parentId_500BA1925D9F48F48556DCEB1C1F7DA7 = Id FROM Categories WHERE Slug = 'subaru' AND IsDeleted = 0
    IF @parentId_500BA1925D9F48F48556DCEB1C1F7DA7 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('500BA192-5D9F-48F4-8556-DCEB1C1F7DA7', N'Outback III', 'subaru-outback-iii', @parentId_500BA1925D9F48F48556DCEB1C1F7DA7, NULL, NULL, 10, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'subaru-outback-iv' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_E0C145F3D2A0416BB61B574BD884122D uniqueidentifier
    SELECT @parentId_E0C145F3D2A0416BB61B574BD884122D = Id FROM Categories WHERE Slug = 'subaru' AND IsDeleted = 0
    IF @parentId_E0C145F3D2A0416BB61B574BD884122D IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('E0C145F3-D2A0-416B-B61B-574BD884122D', N'Outback IV', 'subaru-outback-iv', @parentId_E0C145F3D2A0416BB61B574BD884122D, NULL, NULL, 11, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'subaru-outback-v' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_C34AD4A2D274488ABE13D7CC3455D2C6 uniqueidentifier
    SELECT @parentId_C34AD4A2D274488ABE13D7CC3455D2C6 = Id FROM Categories WHERE Slug = 'subaru' AND IsDeleted = 0
    IF @parentId_C34AD4A2D274488ABE13D7CC3455D2C6 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('C34AD4A2-D274-488A-BE13-D7CC3455D2C6', N'Outback V', 'subaru-outback-v', @parentId_C34AD4A2D274488ABE13D7CC3455D2C6, NULL, NULL, 12, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'subaru-forester-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_8DD93630FA29465798021184A04C5296 uniqueidentifier
    SELECT @parentId_8DD93630FA29465798021184A04C5296 = Id FROM Categories WHERE Slug = 'subaru' AND IsDeleted = 0
    IF @parentId_8DD93630FA29465798021184A04C5296 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('8DD93630-FA29-4657-9802-1184A04C5296', N'Forester I', 'subaru-forester-i', @parentId_8DD93630FA29465798021184A04C5296, NULL, NULL, 13, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'subaru-forester-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_9F63530104294C259A8861C2B133453E uniqueidentifier
    SELECT @parentId_9F63530104294C259A8861C2B133453E = Id FROM Categories WHERE Slug = 'subaru' AND IsDeleted = 0
    IF @parentId_9F63530104294C259A8861C2B133453E IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('9F635301-0429-4C25-9A88-61C2B133453E', N'Forester II', 'subaru-forester-ii', @parentId_9F63530104294C259A8861C2B133453E, NULL, NULL, 14, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'subaru-forester-iii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_BF52CE9DD3714AE69AA881F985648462 uniqueidentifier
    SELECT @parentId_BF52CE9DD3714AE69AA881F985648462 = Id FROM Categories WHERE Slug = 'subaru' AND IsDeleted = 0
    IF @parentId_BF52CE9DD3714AE69AA881F985648462 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('BF52CE9D-D371-4AE6-9AA8-81F985648462', N'Forester III', 'subaru-forester-iii', @parentId_BF52CE9DD3714AE69AA881F985648462, NULL, NULL, 15, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'subaru-forester-iv' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_AB6567140F46462990BEA862A90004E5 uniqueidentifier
    SELECT @parentId_AB6567140F46462990BEA862A90004E5 = Id FROM Categories WHERE Slug = 'subaru' AND IsDeleted = 0
    IF @parentId_AB6567140F46462990BEA862A90004E5 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('AB656714-0F46-4629-90BE-A862A90004E5', N'Forester IV', 'subaru-forester-iv', @parentId_AB6567140F46462990BEA862A90004E5, NULL, NULL, 16, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'subaru-forester-v' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_FAD8B632BB234C6590E0CBA0BB71D04F uniqueidentifier
    SELECT @parentId_FAD8B632BB234C6590E0CBA0BB71D04F = Id FROM Categories WHERE Slug = 'subaru' AND IsDeleted = 0
    IF @parentId_FAD8B632BB234C6590E0CBA0BB71D04F IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('FAD8B632-BB23-4C65-90E0-CBA0BB71D04F', N'Forester V', 'subaru-forester-v', @parentId_FAD8B632BB234C6590E0CBA0BB71D04F, NULL, NULL, 17, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'subaru-xv-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_C3615C7F4D23462D8AC12AA73BE0C796 uniqueidentifier
    SELECT @parentId_C3615C7F4D23462D8AC12AA73BE0C796 = Id FROM Categories WHERE Slug = 'subaru' AND IsDeleted = 0
    IF @parentId_C3615C7F4D23462D8AC12AA73BE0C796 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('C3615C7F-4D23-462D-8AC1-2AA73BE0C796', N'XV I', 'subaru-xv-i', @parentId_C3615C7F4D23462D8AC12AA73BE0C796, NULL, NULL, 18, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'subaru-xv-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_A4B3EFFBC5284193BECA8C02B2A14DC2 uniqueidentifier
    SELECT @parentId_A4B3EFFBC5284193BECA8C02B2A14DC2 = Id FROM Categories WHERE Slug = 'subaru' AND IsDeleted = 0
    IF @parentId_A4B3EFFBC5284193BECA8C02B2A14DC2 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('A4B3EFFB-C528-4193-BECA-8C02B2A14DC2', N'XV II', 'subaru-xv-ii', @parentId_A4B3EFFBC5284193BECA8C02B2A14DC2, NULL, NULL, 19, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'subaru-brz-i' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_90E7DF1DA5C24377929C2FE3AAEDAADA uniqueidentifier
    SELECT @parentId_90E7DF1DA5C24377929C2FE3AAEDAADA = Id FROM Categories WHERE Slug = 'subaru' AND IsDeleted = 0
    IF @parentId_90E7DF1DA5C24377929C2FE3AAEDAADA IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('90E7DF1D-A5C2-4377-929C-2FE3AAEDAADA', N'BRZ I', 'subaru-brz-i', @parentId_90E7DF1DA5C24377929C2FE3AAEDAADA, NULL, NULL, 20, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'subaru-brz-ii' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_FD03C43648D0412E89550FB36192621D uniqueidentifier
    SELECT @parentId_FD03C43648D0412E89550FB36192621D = Id FROM Categories WHERE Slug = 'subaru' AND IsDeleted = 0
    IF @parentId_FD03C43648D0412E89550FB36192621D IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('FD03C436-48D0-412E-8955-0FB36192621D', N'BRZ II', 'subaru-brz-ii', @parentId_FD03C43648D0412E89550FB36192621D, NULL, NULL, 21, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'saab' AND IsDeleted = 0)
BEGIN
    INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
    VALUES ('AD371686-AAF0-4E8F-B88F-9F16A44FDC2D', N'Saab', 'saab', NULL, NULL, NULL, 28, 1, 1, 1, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
ELSE
BEGIN
    -- Varsa ShowInVehicleNav=true gÃ¼ncelle
    UPDATE Categories SET ShowInVehicleNav = 1 WHERE Slug = 'saab' AND IsDeleted = 0
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'saab-9-3-ys3d' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_3506A10FD85C4B0E9536CB7C408F3C8D uniqueidentifier
    SELECT @parentId_3506A10FD85C4B0E9536CB7C408F3C8D = Id FROM Categories WHERE Slug = 'saab' AND IsDeleted = 0
    IF @parentId_3506A10FD85C4B0E9536CB7C408F3C8D IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('3506A10F-D85C-4B0E-9536-CB7C408F3C8D', N'9-3 YS3D', 'saab-9-3-ys3d', @parentId_3506A10FD85C4B0E9536CB7C408F3C8D, NULL, NULL, 0, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'saab-9-3-ys3f' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_87580E43BDA44210B02638EE63DB2494 uniqueidentifier
    SELECT @parentId_87580E43BDA44210B02638EE63DB2494 = Id FROM Categories WHERE Slug = 'saab' AND IsDeleted = 0
    IF @parentId_87580E43BDA44210B02638EE63DB2494 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('87580E43-BDA4-4210-B026-38EE63DB2494', N'9-3 YS3F', 'saab-9-3-ys3f', @parentId_87580E43BDA44210B02638EE63DB2494, NULL, NULL, 1, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'saab-9-5-ys3e' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_AECE4A92F7554AB682A536C976D1B741 uniqueidentifier
    SELECT @parentId_AECE4A92F7554AB682A536C976D1B741 = Id FROM Categories WHERE Slug = 'saab' AND IsDeleted = 0
    IF @parentId_AECE4A92F7554AB682A536C976D1B741 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('AECE4A92-F755-4AB6-82A5-36C976D1B741', N'9-5 YS3E', 'saab-9-5-ys3e', @parentId_AECE4A92F7554AB682A536C976D1B741, NULL, NULL, 2, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'saab-9-5-ys3g' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_AD8A82E174314EE199BCE9062F554A9F uniqueidentifier
    SELECT @parentId_AD8A82E174314EE199BCE9062F554A9F = Id FROM Categories WHERE Slug = 'saab' AND IsDeleted = 0
    IF @parentId_AD8A82E174314EE199BCE9062F554A9F IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('AD8A82E1-7431-4EE1-99BC-E9062F554A9F', N'9-5 YS3G', 'saab-9-5-ys3g', @parentId_AD8A82E174314EE199BCE9062F554A9F, NULL, NULL, 3, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'saab-9000' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_FF75BA9FD3F24BD8997BE1E97D9CF554 uniqueidentifier
    SELECT @parentId_FF75BA9FD3F24BD8997BE1E97D9CF554 = Id FROM Categories WHERE Slug = 'saab' AND IsDeleted = 0
    IF @parentId_FF75BA9FD3F24BD8997BE1E97D9CF554 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('FF75BA9F-D3F2-4BD8-997B-E1E97D9CF554', N'9000', 'saab-9000', @parentId_FF75BA9FD3F24BD8997BE1E97D9CF554, NULL, NULL, 4, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'lexus' AND IsDeleted = 0)
BEGIN
    INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
    VALUES ('C4EF9B01-E396-4AE5-8937-55E8B3D19F98', N'Lexus', 'lexus', NULL, NULL, NULL, 29, 1, 1, 1, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
ELSE
BEGIN
    -- Varsa ShowInVehicleNav=true gÃ¼ncelle
    UPDATE Categories SET ShowInVehicleNav = 1 WHERE Slug = 'lexus' AND IsDeleted = 0
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'lexus-is200' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_40FA903D055A488DACD55434262204FA uniqueidentifier
    SELECT @parentId_40FA903D055A488DACD55434262204FA = Id FROM Categories WHERE Slug = 'lexus' AND IsDeleted = 0
    IF @parentId_40FA903D055A488DACD55434262204FA IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('40FA903D-055A-488D-ACD5-5434262204FA', N'IS200', 'lexus-is200', @parentId_40FA903D055A488DACD55434262204FA, NULL, NULL, 0, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'lexus-is220' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_1778C297AF4F4F998699920A030FE760 uniqueidentifier
    SELECT @parentId_1778C297AF4F4F998699920A030FE760 = Id FROM Categories WHERE Slug = 'lexus' AND IsDeleted = 0
    IF @parentId_1778C297AF4F4F998699920A030FE760 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('1778C297-AF4F-4F99-8699-920A030FE760', N'IS220', 'lexus-is220', @parentId_1778C297AF4F4F998699920A030FE760, NULL, NULL, 1, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'lexus-is250' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_6D3CE18915284C9D93FF15EBD7935BE5 uniqueidentifier
    SELECT @parentId_6D3CE18915284C9D93FF15EBD7935BE5 = Id FROM Categories WHERE Slug = 'lexus' AND IsDeleted = 0
    IF @parentId_6D3CE18915284C9D93FF15EBD7935BE5 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('6D3CE189-1528-4C9D-93FF-15EBD7935BE5', N'IS250', 'lexus-is250', @parentId_6D3CE18915284C9D93FF15EBD7935BE5, NULL, NULL, 2, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'lexus-is300h' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_B34E519BED324A85AC151790410F5A37 uniqueidentifier
    SELECT @parentId_B34E519BED324A85AC151790410F5A37 = Id FROM Categories WHERE Slug = 'lexus' AND IsDeleted = 0
    IF @parentId_B34E519BED324A85AC151790410F5A37 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('B34E519B-ED32-4A85-AC15-1790410F5A37', N'IS300h', 'lexus-is300h', @parentId_B34E519BED324A85AC151790410F5A37, NULL, NULL, 3, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'lexus-is350' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_9745AB5E6AF54C15A8D1EFF6597CB5FE uniqueidentifier
    SELECT @parentId_9745AB5E6AF54C15A8D1EFF6597CB5FE = Id FROM Categories WHERE Slug = 'lexus' AND IsDeleted = 0
    IF @parentId_9745AB5E6AF54C15A8D1EFF6597CB5FE IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('9745AB5E-6AF5-4C15-A8D1-EFF6597CB5FE', N'IS350', 'lexus-is350', @parentId_9745AB5E6AF54C15A8D1EFF6597CB5FE, NULL, NULL, 4, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'lexus-es300h' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_F951FAF5CACB465982DC5C8F78CA9019 uniqueidentifier
    SELECT @parentId_F951FAF5CACB465982DC5C8F78CA9019 = Id FROM Categories WHERE Slug = 'lexus' AND IsDeleted = 0
    IF @parentId_F951FAF5CACB465982DC5C8F78CA9019 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('F951FAF5-CACB-4659-82DC-5C8F78CA9019', N'ES300h', 'lexus-es300h', @parentId_F951FAF5CACB465982DC5C8F78CA9019, NULL, NULL, 5, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'lexus-es350' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_0C74B00B2437438F8D78A1D623E0B676 uniqueidentifier
    SELECT @parentId_0C74B00B2437438F8D78A1D623E0B676 = Id FROM Categories WHERE Slug = 'lexus' AND IsDeleted = 0
    IF @parentId_0C74B00B2437438F8D78A1D623E0B676 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('0C74B00B-2437-438F-8D78-A1D623E0B676', N'ES350', 'lexus-es350', @parentId_0C74B00B2437438F8D78A1D623E0B676, NULL, NULL, 6, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'lexus-gs300' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_E8F7FA71FAB741A2BEEAE7FBA2E21B06 uniqueidentifier
    SELECT @parentId_E8F7FA71FAB741A2BEEAE7FBA2E21B06 = Id FROM Categories WHERE Slug = 'lexus' AND IsDeleted = 0
    IF @parentId_E8F7FA71FAB741A2BEEAE7FBA2E21B06 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('E8F7FA71-FAB7-41A2-BEEA-E7FBA2E21B06', N'GS300', 'lexus-gs300', @parentId_E8F7FA71FAB741A2BEEAE7FBA2E21B06, NULL, NULL, 7, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'lexus-gs430' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_3D04F33F42FF49AFB8F52C3175A2A0E8 uniqueidentifier
    SELECT @parentId_3D04F33F42FF49AFB8F52C3175A2A0E8 = Id FROM Categories WHERE Slug = 'lexus' AND IsDeleted = 0
    IF @parentId_3D04F33F42FF49AFB8F52C3175A2A0E8 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('3D04F33F-42FF-49AF-B8F5-2C3175A2A0E8', N'GS430', 'lexus-gs430', @parentId_3D04F33F42FF49AFB8F52C3175A2A0E8, NULL, NULL, 8, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'lexus-gs450h' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_D3D26A5C0BE9435B97F47F59B4246BC7 uniqueidentifier
    SELECT @parentId_D3D26A5C0BE9435B97F47F59B4246BC7 = Id FROM Categories WHERE Slug = 'lexus' AND IsDeleted = 0
    IF @parentId_D3D26A5C0BE9435B97F47F59B4246BC7 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('D3D26A5C-0BE9-435B-97F4-7F59B4246BC7', N'GS450h', 'lexus-gs450h', @parentId_D3D26A5C0BE9435B97F47F59B4246BC7, NULL, NULL, 9, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'lexus-ls400' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_BB5AA6B4BA6045D0893DB0CA553873A1 uniqueidentifier
    SELECT @parentId_BB5AA6B4BA6045D0893DB0CA553873A1 = Id FROM Categories WHERE Slug = 'lexus' AND IsDeleted = 0
    IF @parentId_BB5AA6B4BA6045D0893DB0CA553873A1 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('BB5AA6B4-BA60-45D0-893D-B0CA553873A1', N'LS400', 'lexus-ls400', @parentId_BB5AA6B4BA6045D0893DB0CA553873A1, NULL, NULL, 10, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'lexus-ls430' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_1EEB888D544641C580FB95A86AD3D4EB uniqueidentifier
    SELECT @parentId_1EEB888D544641C580FB95A86AD3D4EB = Id FROM Categories WHERE Slug = 'lexus' AND IsDeleted = 0
    IF @parentId_1EEB888D544641C580FB95A86AD3D4EB IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('1EEB888D-5446-41C5-80FB-95A86AD3D4EB', N'LS430', 'lexus-ls430', @parentId_1EEB888D544641C580FB95A86AD3D4EB, NULL, NULL, 11, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'lexus-ls460' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_72F666CF752C43EC99DC32BAB10DE521 uniqueidentifier
    SELECT @parentId_72F666CF752C43EC99DC32BAB10DE521 = Id FROM Categories WHERE Slug = 'lexus' AND IsDeleted = 0
    IF @parentId_72F666CF752C43EC99DC32BAB10DE521 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('72F666CF-752C-43EC-99DC-32BAB10DE521', N'LS460', 'lexus-ls460', @parentId_72F666CF752C43EC99DC32BAB10DE521, NULL, NULL, 12, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'lexus-ls500h' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_9ECAD00F23E7428689526E128B531B74 uniqueidentifier
    SELECT @parentId_9ECAD00F23E7428689526E128B531B74 = Id FROM Categories WHERE Slug = 'lexus' AND IsDeleted = 0
    IF @parentId_9ECAD00F23E7428689526E128B531B74 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('9ECAD00F-23E7-4286-8952-6E128B531B74', N'LS500h', 'lexus-ls500h', @parentId_9ECAD00F23E7428689526E128B531B74, NULL, NULL, 13, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'lexus-ux250h' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_55E7161E6AFE4A129758FE2698FB02C1 uniqueidentifier
    SELECT @parentId_55E7161E6AFE4A129758FE2698FB02C1 = Id FROM Categories WHERE Slug = 'lexus' AND IsDeleted = 0
    IF @parentId_55E7161E6AFE4A129758FE2698FB02C1 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('55E7161E-6AFE-4A12-9758-FE2698FB02C1', N'UX250h', 'lexus-ux250h', @parentId_55E7161E6AFE4A129758FE2698FB02C1, NULL, NULL, 14, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'lexus-nx200t' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_71BB0A69DB3D4E5C82764F7EE7467E77 uniqueidentifier
    SELECT @parentId_71BB0A69DB3D4E5C82764F7EE7467E77 = Id FROM Categories WHERE Slug = 'lexus' AND IsDeleted = 0
    IF @parentId_71BB0A69DB3D4E5C82764F7EE7467E77 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('71BB0A69-DB3D-4E5C-8276-4F7EE7467E77', N'NX200t', 'lexus-nx200t', @parentId_71BB0A69DB3D4E5C82764F7EE7467E77, NULL, NULL, 15, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'lexus-nx300h' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_9DDF7823DD634A6695CE8F613FE7C607 uniqueidentifier
    SELECT @parentId_9DDF7823DD634A6695CE8F613FE7C607 = Id FROM Categories WHERE Slug = 'lexus' AND IsDeleted = 0
    IF @parentId_9DDF7823DD634A6695CE8F613FE7C607 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('9DDF7823-DD63-4A66-95CE-8F613FE7C607', N'NX300h', 'lexus-nx300h', @parentId_9DDF7823DD634A6695CE8F613FE7C607, NULL, NULL, 16, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'lexus-nx350h' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_4106AC2006A24BADB80C107E90001DBA uniqueidentifier
    SELECT @parentId_4106AC2006A24BADB80C107E90001DBA = Id FROM Categories WHERE Slug = 'lexus' AND IsDeleted = 0
    IF @parentId_4106AC2006A24BADB80C107E90001DBA IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('4106AC20-06A2-4BAD-B80C-107E90001DBA', N'NX350h', 'lexus-nx350h', @parentId_4106AC2006A24BADB80C107E90001DBA, NULL, NULL, 17, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'lexus-rx300' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_66B12AF4478D46A285BCCAF96E8F413B uniqueidentifier
    SELECT @parentId_66B12AF4478D46A285BCCAF96E8F413B = Id FROM Categories WHERE Slug = 'lexus' AND IsDeleted = 0
    IF @parentId_66B12AF4478D46A285BCCAF96E8F413B IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('66B12AF4-478D-46A2-85BC-CAF96E8F413B', N'RX300', 'lexus-rx300', @parentId_66B12AF4478D46A285BCCAF96E8F413B, NULL, NULL, 18, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'lexus-rx330' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_0F00CFE8375C4318BA0D858B949D5B77 uniqueidentifier
    SELECT @parentId_0F00CFE8375C4318BA0D858B949D5B77 = Id FROM Categories WHERE Slug = 'lexus' AND IsDeleted = 0
    IF @parentId_0F00CFE8375C4318BA0D858B949D5B77 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('0F00CFE8-375C-4318-BA0D-858B949D5B77', N'RX330', 'lexus-rx330', @parentId_0F00CFE8375C4318BA0D858B949D5B77, NULL, NULL, 19, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'lexus-rx350' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_7AE972FB8E4F459B875604145E1B1A37 uniqueidentifier
    SELECT @parentId_7AE972FB8E4F459B875604145E1B1A37 = Id FROM Categories WHERE Slug = 'lexus' AND IsDeleted = 0
    IF @parentId_7AE972FB8E4F459B875604145E1B1A37 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('7AE972FB-8E4F-459B-8756-04145E1B1A37', N'RX350', 'lexus-rx350', @parentId_7AE972FB8E4F459B875604145E1B1A37, NULL, NULL, 20, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'lexus-rx450h' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_93631A265A2D483F84EEB079BD3399AB uniqueidentifier
    SELECT @parentId_93631A265A2D483F84EEB079BD3399AB = Id FROM Categories WHERE Slug = 'lexus' AND IsDeleted = 0
    IF @parentId_93631A265A2D483F84EEB079BD3399AB IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('93631A26-5A2D-483F-84EE-B079BD3399AB', N'RX450h', 'lexus-rx450h', @parentId_93631A265A2D483F84EEB079BD3399AB, NULL, NULL, 21, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'lexus-lx470' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_4C5D79249D3E42FC84654F6669A97E7C uniqueidentifier
    SELECT @parentId_4C5D79249D3E42FC84654F6669A97E7C = Id FROM Categories WHERE Slug = 'lexus' AND IsDeleted = 0
    IF @parentId_4C5D79249D3E42FC84654F6669A97E7C IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('4C5D7924-9D3E-42FC-8465-4F6669A97E7C', N'LX470', 'lexus-lx470', @parentId_4C5D79249D3E42FC84654F6669A97E7C, NULL, NULL, 22, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'lexus-lx570' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_60B26A23DD244C19A796A3B29C0F7B0A uniqueidentifier
    SELECT @parentId_60B26A23DD244C19A796A3B29C0F7B0A = Id FROM Categories WHERE Slug = 'lexus' AND IsDeleted = 0
    IF @parentId_60B26A23DD244C19A796A3B29C0F7B0A IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('60B26A23-DD24-4C19-A796-A3B29C0F7B0A', N'LX570', 'lexus-lx570', @parentId_60B26A23DD244C19A796A3B29C0F7B0A, NULL, NULL, 23, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'lexus-ct200h' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_67C5B5958A4D441EA4264BDCEB6CFE2C uniqueidentifier
    SELECT @parentId_67C5B5958A4D441EA4264BDCEB6CFE2C = Id FROM Categories WHERE Slug = 'lexus' AND IsDeleted = 0
    IF @parentId_67C5B5958A4D441EA4264BDCEB6CFE2C IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('67C5B595-8A4D-441E-A426-4BDCEB6CFE2C', N'CT200h', 'lexus-ct200h', @parentId_67C5B5958A4D441EA4264BDCEB6CFE2C, NULL, NULL, 24, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'tofas' AND IsDeleted = 0)
BEGIN
    INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
    VALUES ('B78C0EC0-556E-47A8-A78B-45CDCD4FC954', N'Tofas', 'tofas', NULL, NULL, NULL, 30, 1, 1, 1, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
ELSE
BEGIN
    -- Varsa ShowInVehicleNav=true gÃ¼ncelle
    UPDATE Categories SET ShowInVehicleNav = 1 WHERE Slug = 'tofas' AND IsDeleted = 0
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'tofas-dogan' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_39D978CAB1BD4C298B274484BCA03B5A uniqueidentifier
    SELECT @parentId_39D978CAB1BD4C298B274484BCA03B5A = Id FROM Categories WHERE Slug = 'tofas' AND IsDeleted = 0
    IF @parentId_39D978CAB1BD4C298B274484BCA03B5A IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('39D978CA-B1BD-4C29-8B27-4484BCA03B5A', N'Dogan', 'tofas-dogan', @parentId_39D978CAB1BD4C298B274484BCA03B5A, NULL, NULL, 0, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'tofas-dogan-slx' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_4A9D1A11F6D8492089CE2FDB2FE8D81E uniqueidentifier
    SELECT @parentId_4A9D1A11F6D8492089CE2FDB2FE8D81E = Id FROM Categories WHERE Slug = 'tofas' AND IsDeleted = 0
    IF @parentId_4A9D1A11F6D8492089CE2FDB2FE8D81E IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('4A9D1A11-F6D8-4920-89CE-2FDB2FE8D81E', N'Dogan SLX', 'tofas-dogan-slx', @parentId_4A9D1A11F6D8492089CE2FDB2FE8D81E, NULL, NULL, 1, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'tofas-sahin' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_8CBE6B9DB8C14C9787B1EA865EE0D6C8 uniqueidentifier
    SELECT @parentId_8CBE6B9DB8C14C9787B1EA865EE0D6C8 = Id FROM Categories WHERE Slug = 'tofas' AND IsDeleted = 0
    IF @parentId_8CBE6B9DB8C14C9787B1EA865EE0D6C8 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('8CBE6B9D-B8C1-4C97-87B1-EA865EE0D6C8', N'Sahin', 'tofas-sahin', @parentId_8CBE6B9DB8C14C9787B1EA865EE0D6C8, NULL, NULL, 2, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'tofas-sahin-s' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_82017E70EF9840EF8CFD2431204FD9C5 uniqueidentifier
    SELECT @parentId_82017E70EF9840EF8CFD2431204FD9C5 = Id FROM Categories WHERE Slug = 'tofas' AND IsDeleted = 0
    IF @parentId_82017E70EF9840EF8CFD2431204FD9C5 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('82017E70-EF98-40EF-8CFD-2431204FD9C5', N'Sahin S', 'tofas-sahin-s', @parentId_82017E70EF9840EF8CFD2431204FD9C5, NULL, NULL, 3, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'tofas-kartal' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_68FBB4C0CD5E4F2CAB399504DE5BFE31 uniqueidentifier
    SELECT @parentId_68FBB4C0CD5E4F2CAB399504DE5BFE31 = Id FROM Categories WHERE Slug = 'tofas' AND IsDeleted = 0
    IF @parentId_68FBB4C0CD5E4F2CAB399504DE5BFE31 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('68FBB4C0-CD5E-4F2C-AB39-9504DE5BFE31', N'Kartal', 'tofas-kartal', @parentId_68FBB4C0CD5E4F2CAB399504DE5BFE31, NULL, NULL, 4, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'tofas-kartal-slx' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_D32A3734237B499EA685CAA40A1874F2 uniqueidentifier
    SELECT @parentId_D32A3734237B499EA685CAA40A1874F2 = Id FROM Categories WHERE Slug = 'tofas' AND IsDeleted = 0
    IF @parentId_D32A3734237B499EA685CAA40A1874F2 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('D32A3734-237B-499E-A685-CAA40A1874F2', N'Kartal SLX', 'tofas-kartal-slx', @parentId_D32A3734237B499EA685CAA40A1874F2, NULL, NULL, 5, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'tofas-tempra' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_97C022242F9A4C48B3C3CB67CC4BC572 uniqueidentifier
    SELECT @parentId_97C022242F9A4C48B3C3CB67CC4BC572 = Id FROM Categories WHERE Slug = 'tofas' AND IsDeleted = 0
    IF @parentId_97C022242F9A4C48B3C3CB67CC4BC572 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('97C02224-2F9A-4C48-B3C3-CB67CC4BC572', N'Tempra', 'tofas-tempra', @parentId_97C022242F9A4C48B3C3CB67CC4BC572, NULL, NULL, 6, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'tofas-fiorino' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_E752F9AAFA5C4A39AF5C2583DAE19114 uniqueidentifier
    SELECT @parentId_E752F9AAFA5C4A39AF5C2583DAE19114 = Id FROM Categories WHERE Slug = 'tofas' AND IsDeleted = 0
    IF @parentId_E752F9AAFA5C4A39AF5C2583DAE19114 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('E752F9AA-FA5C-4A39-AF5C-2583DAE19114', N'Fiorino', 'tofas-fiorino', @parentId_E752F9AAFA5C4A39AF5C2583DAE19114, NULL, NULL, 7, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'tofas-brava' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_520C3CC0EE1D4402A7684818236FD72F uniqueidentifier
    SELECT @parentId_520C3CC0EE1D4402A7684818236FD72F = Id FROM Categories WHERE Slug = 'tofas' AND IsDeleted = 0
    IF @parentId_520C3CC0EE1D4402A7684818236FD72F IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('520C3CC0-EE1D-4402-A768-4818236FD72F', N'Brava', 'tofas-brava', @parentId_520C3CC0EE1D4402A7684818236FD72F, NULL, NULL, 8, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'tofas-uno' AND IsDeleted = 0)
BEGIN
    DECLARE @parentId_F8D4B55D43DC4A6DAD50DC02E35BA1F2 uniqueidentifier
    SELECT @parentId_F8D4B55D43DC4A6DAD50DC02E35BA1F2 = Id FROM Categories WHERE Slug = 'tofas' AND IsDeleted = 0
    IF @parentId_F8D4B55D43DC4A6DAD50DC02E35BA1F2 IS NOT NULL
        INSERT INTO Categories (Id, Name, Slug, ParentCategoryId, Description, ImageUrl, SortOrder, IsActive, ShowInMenu, ShowInVehicleNav, IsDeleted, CreatedDate, MetaTitle, MetaDescription, Icon, StylesJson, VideoUrl, ImportedFromSourceId, CreatedByAdminId)
        VALUES ('F8D4B55D-43DC-4A6D-AD50-DC02E35BA1F2', N'Uno', 'tofas-uno', @parentId_F8D4B55D43DC4A6DAD50DC02E35BA1F2, NULL, NULL, 9, 1, 1, 0, 0, '2026-07-03 19:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
END
