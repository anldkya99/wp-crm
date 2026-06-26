INSERT INTO "member_tags" ("id", "name", "color")
VALUES
  ('tag_coo_vip', 'VIP', 'emerald'),
  ('tag_coo_bonus_avcisi', 'Bonus Avcısı', 'amber'),
  ('tag_coo_riskli', 'Riskli', 'rose'),
  ('tag_coo_aktif_oyuncu', 'Aktif Oyuncu', 'mint'),
  ('tag_coo_takip_gerekiyor', 'Takip Gerekiyor', 'cyan')
ON CONFLICT ("name") DO NOTHING;
