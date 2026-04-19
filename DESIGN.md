# System Architecture and Design Decisions (EN)

## 1. Domain Modeling
Following Domain-Driven Design (DDD) principles:
- **Transactions Model**: Central to the system. Handles the core lifecycle (stage transitions, validations).
  - *History array (Audit Trail)* ensures we have immutable records of stage completions.
  - Using `TransactionStage` strict enums (`agreement`, `earnest_money`, `title_deed`, `completed`) mathematically mapped in an isolated utility prevents logic skipping.
- **Commissions Model**: Handled in a decoupled way. By storing commission distributions in a separate collection (`commissions`), we adhere to the Single Responsibility Principle. Complex 50% / 25-25% derivations are isolated and don't bloat the Transaction document.

## 2. Defensive Backend Operations
- **Idempotency**: Commission derivation cannot run twice for the same transaction. Mongoose unique constraints mixed with algorithmic checks prevent duplicate records.
- **Financial Arithmetic Safety**: Calculating splits with `round(amount * 100)` avoids Javascript native float limitations and sub-zero leakage.
- **Rollback Pattern**: Real-world operations result in transaction cancellations. A `DELETE` trigger cascades safely through transactions and purges active commissions. If a stage completes, editing is explicitly blocked via an exception handler to preserve system integrity. A strictly defined `UpdateTransactionDto` protects data tampering.

## 3. Frontend Architecture
Built securely natively via Nuxt 3 scaling best practices:
- **Store-driven Security (Pinia)**: JWT-based claims handle route protections, managing Admin/Agent separation directly inside the Vue state.
- **Micro UI Transitions**: Instead of heavy reloads, single-page seamless dynamic rendering via TailwindCSS gives it a premium feel. Exporting data to Excel is heavily localized to the client side saving backend computations.
- **Bilingual Nature**: State variables reactively switch between English and Turkish reflecting a ready-to-deploy Global interface.

---

# Sistem Mimarisi ve Tasarım Kararları (TR)

## 1. Veri Modelleme
Domain-Driven Design (DDD) prensipleri takip edilmiştir:
- **Transactions (İşlem) Modeli**: Sistemin kalbidir. İşlem yaşam döngüsünü, onayları ve geçerlilikleri içerir.
  - *History (Tarihçe)* dizisi, aşamaların değiştirilemez kayıtlarını (Audit Trail) tutar.
  - Kesin kurallı `TransactionStage` enum yapısı (`agreement`, `earnest_money`, `title_deed`, `completed`), izole bir geçiş haritasıyla aşama atlatma hilelerini engeller.
- **Commissions (Komisyon) Modeli**: Bağımsız hale getirilmiştir. Komisyon dağıtımlarını ayrı bir koleksiyonda (`commissions`) saklayarak "Tek Sorumluluk Prensibi"ne (Single Responsibility Principle) uyarız. %50 ve %25-25 gibi karmaşık kırılımlar işlemin orijinal belgesini (Transaction document) şişirmez.

## 2. Defansif Backend Operasyonları
- **Hata Toleransı (Idempotency)**: Bir işlemin maliyet dağıtımı iki kez çalıştırılamaz. Hem MongoDB `unique` kuralları hem de algoritmik koruma mevcuttur.
- **Finansal Aritmetik Güvenliği**: Bölme işlemlerinde kuruş kaybetmeyi engellemek için Javascript'in ham hesaplamaları yerine `amount * 100` yuvarlama (cents) mantığı kullanılarak sapmalar engellenmiştir.
- **Rollback (Geri Alma) Deseni**: Gerçek dünyadaki iptalleri kucaklayan bir sistem... Aşama bittikten (`completed`) sonra güvenlik için düzenleme (Edit) bloklanır. Verilerin "Geri Al" operasyonu ile geçmiş aşamaya düşürülmesiyle hatalı/fazla girilen komisyon kayıtlarının `Cascade` mantığı tarzında güvenlice silinmesi sağlanır. Güvenliği yükseltmek adına işlemlere `UpdateTransactionDto` katı kalıbı (strict-typing) giydirilmiştir.

## 3. Frontend Mimarisi
Nuxt 3 iyi pratikleriyle güvenli ve native olarak tasarlandı:
- **Pinia Merkezli Güvenlik**: JWT tabanlı (claim) doğrulamaları sayesinde Admin/Danışman ayrımları doğrudan Vue statik hafızasında tutulur.
- **Mikro UI Geçişleri**: Ağır sayfa yüklemeleri yerine, TailwindCSS aracılığıyla tek sayfada pürüzsüz dinamik render etme mimarisi kurularak premium bir hissiyat sağlandı. Excel'e veri çıkartma işlemleri doğrudan tarayıcı işlemcisinde halledilerek arkaplanda yük hafifletildi.
- **Çift Dilde Akıcılık**: State değişkenleriyle global bir arayüz imkanı sunularak İngilizce ve Türkçe arasında kesintisiz dil değişimi sağlandı.